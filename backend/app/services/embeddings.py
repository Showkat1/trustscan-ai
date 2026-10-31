from __future__ import annotations

import asyncio
import hashlib
import math
import re
from typing import Iterable

from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_TOKEN_RE = re.compile(r"[a-z0-9\u0600-\u06ff]+", re.IGNORECASE)


class EmbeddingService:
    """Embedding provider with a zero-dependency deterministic fallback.

    The fallback is a signed feature-hashing vector over word unigrams and
    character trigrams. It is not a replacement for a neural embedding model,
    but it keeps semantic-ish retrieval and the full product working offline.
    """

    def __init__(self) -> None:
        self._model = None
        self._provider = settings.embedding_provider
        self._lock = asyncio.Lock()

    @property
    def provider(self) -> str:
        return self._provider

    async def embed(self, text: str) -> list[float]:
        vectors = await self.embed_many([text])
        return vectors[0]

    async def embed_many(self, texts: Iterable[str]) -> list[list[float]]:
        items = [text.strip() for text in texts]
        if not items:
            return []

        if self._provider == "openai" and settings.llm_api_key:
            try:
                return await self._openai_embed(items)
            except Exception as exc:  # pragma: no cover - network dependent
                logger.warning("openai_embedding_failed", error=str(exc))
                self._provider = "hash"

        if self._provider == "sentence-transformers":
            try:
                return await self._sentence_transformer_embed(items)
            except Exception as exc:  # pragma: no cover - optional dependency
                logger.warning("sentence_transformer_failed", error=str(exc))
                self._provider = "hash"

        return [self._hash_embed(text) for text in items]

    async def _openai_embed(self, texts: list[str]) -> list[list[float]]:
        client = AsyncOpenAI(api_key=settings.llm_api_key, base_url=settings.llm_base_url or None)
        response = await client.embeddings.create(
            model=settings.embedding_model
            if settings.embedding_model.startswith("text-embedding")
            else "text-embedding-3-small",
            input=texts,
            dimensions=settings.embedding_dim,
        )
        return [item.embedding for item in response.data]

    async def _sentence_transformer_embed(self, texts: list[str]) -> list[list[float]]:
        async with self._lock:
            if self._model is None:
                from sentence_transformers import SentenceTransformer

                self._model = await asyncio.to_thread(
                    SentenceTransformer, settings.embedding_model
                )
            vectors = await asyncio.to_thread(
                self._model.encode,
                texts,
                normalize_embeddings=True,
            )
        return [vector.tolist() for vector in vectors]

    def _hash_embed(self, text: str) -> list[float]:
        dim = settings.embedding_dim
        vector = [0.0] * dim
        tokens = _TOKEN_RE.findall(text.lower())

        features: list[str] = list(tokens)
        for token in tokens:
            padded = f"#{token}#"
            for index in range(max(0, len(padded) - 2)):
                features.append(padded[index : index + 3])

        for feature in features:
            digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
            bucket = int.from_bytes(digest[:4], "big") % dim
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[bucket] += sign

        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]


embedding_service = EmbeddingService()
