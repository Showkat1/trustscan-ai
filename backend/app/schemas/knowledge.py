from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class KnowledgeDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    source: str
    category: str
    chunk_count: int
    created_at: datetime


class KnowledgeChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    chunk_index: int
    content: str


class KnowledgeDocumentDetail(KnowledgeDocumentOut):
    content: str
    chunks: list[KnowledgeChunkOut] = []


class KnowledgeSearchHit(BaseModel):
    document_id: str
    title: str
    source: str
    text: str
    score: float


class KnowledgeSearchResponse(BaseModel):
    query: str
    hits: list[KnowledgeSearchHit]


class MetaResponse(BaseModel):
    app_name: str
    version: str
    pipeline: list[dict[str, str]]
    input_types: list[str]
    risk_bands: list[dict[str, str | int]]
    llm_mode: str
    embedding_provider: str
