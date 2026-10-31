from __future__ import annotations

import asyncio

from app.core.errors import AppError


def _extract_pdf(data: bytes) -> str:
    import pymupdf

    document = pymupdf.open(stream=data, filetype="pdf")
    try:
        pages = [page.get_text("text") for page in document]
        return "\n\n".join(pages).strip()
    finally:
        document.close()


def _extract_txt(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "utf-16", "latin-1"):
        try:
            return data.decode(encoding).strip()
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace").strip()


class DocumentService:
    async def extract_text(self, filename: str, data: bytes) -> str:
        lowered = filename.lower()
        try:
            if lowered.endswith(".pdf"):
                text = await asyncio.to_thread(_extract_pdf, data)
            elif lowered.endswith((".txt", ".md", ".csv")):
                text = await asyncio.to_thread(_extract_txt, data)
            else:
                raise AppError(
                    "Unsupported document type. Upload a PDF, TXT or MD file.",
                    status_code=422,
                    code="unsupported_document",
                )
        except AppError:
            raise
        except Exception as exc:
            raise AppError(
                "The document could not be read.",
                status_code=422,
                code="document_extraction_failed",
                details=str(exc),
            ) from exc

        if not text:
            raise AppError(
                "No readable text was found in the document.",
                status_code=422,
                code="document_empty",
            )
        return text


document_service = DocumentService()
