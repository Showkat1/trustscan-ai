from __future__ import annotations

import hashlib
from pathlib import Path

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.knowledge import KnowledgeChunk, KnowledgeDocument
from app.schemas.domain import RetrievedSource
from app.services.embeddings import embedding_service

logger = get_logger(__name__)

CATEGORY_HINTS = {
    "phishing": "phishing",
    "job": "job_scam",
    "investment": "investment_scam",
    "payment": "payment_security",
    "cyber": "cyber_fraud",
}


def chunk_text(text: str, *, chunk_words: int = 180, overlap: int = 40) -> list[str]:
    words = text.split()
    if len(words) <= chunk_words:
        return [text.strip()] if text.strip() else []

    chunks: list[str] = []
    step = max(1, chunk_words - overlap)
    for start in range(0, len(words), step):
        chunk = " ".join(words[start : start + chunk_words]).strip()
        if chunk:
            chunks.append(chunk)
        if start + chunk_words >= len(words):
            break
    return chunks


def _parse_document(path: Path) -> tuple[str, str, str]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    title = path.stem.replace("_", " ").title()
    source_label = "TrustScan Knowledge Base"
    for line in raw.splitlines()[:8]:
        if line.upper().startswith("TITLE:"):
            title = line.split(":", 1)[1].strip()
        if line.upper().startswith("SOURCE:"):
            source_label = line.split(":", 1)[1].strip()
    source = f"{source_label} · {path.name}"
    category = "general"
    lowered = f"{path.stem} {title}".lower()
    for hint, value in CATEGORY_HINTS.items():
        if hint in lowered:
            category = value
            break
    return title, source, category


class KnowledgeBaseService:
    async def index_documents(self, session: AsyncSession, *, force: bool = False) -> dict[str, int]:
        directory = Path(settings.knowledge_dir)
        directory.mkdir(parents=True, exist_ok=True)
        files = sorted(directory.glob("*.txt"))

        indexed = 0
        skipped = 0
        chunks_written = 0

        for path in files:
            raw = path.read_text(encoding="utf-8", errors="replace")
            content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
            existing = await session.scalar(
                select(KnowledgeDocument).where(KnowledgeDocument.source.like(f"%{path.name}%"))
            )
            if existing and existing.content_hash == content_hash and not force:
                skipped += 1
                continue

            title, source, category = _parse_document(path)
            if existing is None:
                existing = KnowledgeDocument(
                    title=title,
                    source=source,
                    category=category,
                    content=raw,
                    content_hash=content_hash,
                    chunk_count=0,
                )
                session.add(existing)
            else:
                existing.title = title
                existing.category = category
                existing.content = raw
                existing.content_hash = content_hash
                await session.execute(
                    delete(KnowledgeChunk).where(KnowledgeChunk.document_id == existing.id)
                )

            await session.flush()

            chunks = chunk_text(raw)
            vectors = await embedding_service.embed_many(chunks)
            for index, (chunk, vector) in enumerate(zip(chunks, vectors, strict=True)):
                session.add(
                    KnowledgeChunk(
                        document_id=existing.id,
                        chunk_index=index,
                        content=chunk,
                        embedding=vector,
                    )
                )
            existing.chunk_count = len(chunks)
            chunks_written += len(chunks)
            indexed += 1

        await session.commit()
        logger.info(
            "knowledge_indexed",
            files=len(files),
            indexed=indexed,
            skipped=skipped,
            chunks=chunks_written,
            provider=embedding_service.provider,
        )
        return {"files": len(files), "indexed": indexed, "skipped": skipped, "chunks": chunks_written}

    async def seed_if_empty(self, session: AsyncSession) -> None:
        count = await session.scalar(select(func.count()).select_from(KnowledgeDocument))
        if not count:
            await self.index_documents(session)

    async def search(
        self,
        session: AsyncSession,
        query: str,
        *,
        top_k: int | None = None,
    ) -> list[RetrievedSource]:
        query = (query or "").strip()
        if not query:
            return []

        limit = top_k or settings.rag_top_k
        query_vector = await embedding_service.embed(query)

        if session.bind and session.bind.dialect.name == "postgresql":
            distance = KnowledgeChunk.embedding.cosine_distance(query_vector).label("distance")
            statement = (
                select(KnowledgeChunk, KnowledgeDocument, distance)
                .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
                .order_by(distance)
                .limit(limit)
            )
            rows = (await session.execute(statement)).all()
            return [
                RetrievedSource(
                    document_id=str(document.id),
                    source=document.source,
                    title=document.title,
                    text=chunk.content,
                    score=round(max(0.0, 1.0 - float(dist)), 4),
                )
                for chunk, document, dist in rows
                if float(dist) is not None
            ]

        # SQLite / other dialects: exact cosine similarity in Python.
        statement = select(KnowledgeChunk, KnowledgeDocument).join(
            KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id
        )
        rows = (await session.execute(statement)).all()
        scored: list[tuple[float, KnowledgeChunk, KnowledgeDocument]] = []
        for chunk, document in rows:
            vector = chunk.embedding
            if isinstance(vector, str):
                import json

                vector = json.loads(vector)
            if not vector:
                continue
            score = sum(float(a) * float(b) for a, b in zip(vector, query_vector, strict=False))
            scored.append((score, chunk, document))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            RetrievedSource(
                document_id=str(document.id),
                source=document.source,
                title=document.title,
                text=chunk.content,
                score=round(max(0.0, score), 4),
            )
            for score, chunk, document in scored[:limit]
            if score >= settings.rag_min_score
        ]


knowledge_base = KnowledgeBaseService()
