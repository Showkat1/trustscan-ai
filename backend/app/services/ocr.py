from __future__ import annotations

import asyncio
import io
import shutil
from pathlib import Path

from PIL import Image, ImageOps

from app.core.config import settings
from app.core.errors import AppError


def _configure_tesseract() -> None:
    import pytesseract

    candidates = [
        settings.tesseract_cmd,
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            pytesseract.pytesseract.tesseract_cmd = candidate
            return
    if shutil.which("tesseract"):
        return
    pytesseract.pytesseract.tesseract_cmd = "tesseract"


_configure_tesseract()


def _extract(image_bytes: bytes) -> str:
    import pytesseract

    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image).convert("L")
    if max(image.size) < 1400:
        scale = 1400 / max(image.size)
        image = image.resize(
            (int(image.width * scale), int(image.height * scale)), Image.Resampling.LANCZOS
        )
    text = pytesseract.image_to_string(image, config="--psm 6")
    return text.strip()


class OCRService:
    async def extract_text(self, image_bytes: bytes) -> str:
        if not settings.ocr_enabled:
            raise AppError(
                "OCR is disabled on this deployment.",
                status_code=503,
                code="ocr_disabled",
            )
        try:
            text = await asyncio.to_thread(_extract, image_bytes)
        except Exception as exc:
            raise AppError(
                "OCR could not read this image. Install Tesseract OCR or upload a clearer screenshot.",
                status_code=422,
                code="ocr_failed",
                details=str(exc),
            ) from exc

        if not text:
            raise AppError(
                "No readable text was found in the screenshot.",
                status_code=422,
                code="ocr_empty",
            )
        return text


ocr_service = OCRService()
