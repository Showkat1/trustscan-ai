from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_admin_user, get_current_user
from app.core.db import get_db
from app.core.errors import NotFoundError
from app.models.knowledge import KnowledgeDocument
from app.models.user import User
from app.schemas.knowledge import (
    KnowledgeDocumentDetail,
    KnowledgeDocumentOut,
    KnowledgeSearchHit,
    KnowledgeSearchResponse,
)
from app.services.rag import knowledge_base

router = APIRouter(prefix="/knowledge", tags=["Knowledge base"])


@router.get("", response_model=list[KnowledgeDocumentOut])
async def list_documents(
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[KnowledgeDocumentOut]:
    rows = (
        await db.scalars(select(KnowledgeDocument).order_by(KnowledgeDocument.title))
    ).all()
    return [KnowledgeDocumentOut.model_validate(row) for row in rows]


@router.get("/search", response_model=KnowledgeSearchResponse)
async def search_knowledge(
    q: str = Query(min_length=2, max_length=500),
    top_k: int = Query(5, ge=1, le=10),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeSearchResponse:
    sources = await knowledge_base.search(db, q, top_k=top_k)
    return KnowledgeSearchResponse(
        query=q,
        hits=[
            KnowledgeSearchHit(
                document_id=source.document_id or "",
                title=source.title,
                source=source.source,
                text=source.text,
                score=source.score,
            )
            for source in sources
        ],
    )


@router.post("/reindex", dependencies=[])
async def reindex(
    force: bool = Query(True),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    return await knowledge_base.index_documents(db, force=force)


@router.get("/{document_id}", response_model=KnowledgeDocumentDetail)
async def get_document(
    document_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeDocumentDetail:
    document = await db.scalar(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.id == document_id)
        .options(selectinload(KnowledgeDocument.chunks))
    )
    if document is None:
        raise NotFoundError("Knowledge document not found")
    return KnowledgeDocumentDetail.model_validate(document)
