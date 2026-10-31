from __future__ import annotations

import asyncio
import mimetypes
import re
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.core.errors import AppError

ALLOWED_EXTENSIONS = {
    "screenshot": {".png", ".jpg", ".jpeg", ".webp"},
    "document": {".pdf", ".txt", ".md", ".csv"},
}

_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


@dataclass(slots=True)
class StoredFile:
    original_name: str
    stored_path: str
    size: int
    mime_type: str


class StorageService:
    async def save(
        self,
        *,
        user_id: str,
        input_type: str,
        filename: str,
        data: bytes,
        content_type: str | None,
    ) -> StoredFile:
        if len(data) > settings.max_upload_bytes:
            raise AppError(
                f"File exceeds the {settings.max_upload_size_mb} MB limit.",
                status_code=413,
                code="file_too_large",
            )
        if not data:
            raise AppError("The uploaded file is empty.", status_code=422, code="empty_file")

        suffix = Path(filename).suffix.lower()
        allowed = ALLOWED_EXTENSIONS.get(input_type, set())
        if suffix not in allowed:
            raise AppError(
                f"Unsupported file type '{suffix or 'unknown'}'. Allowed: {', '.join(sorted(allowed))}",
                status_code=422,
                code="unsupported_file_type",
            )

        directory = Path(settings.upload_dir) / str(user_id)
        await asyncio.to_thread(directory.mkdir, parents=True, exist_ok=True)

        safe_stem = _SAFE_NAME.sub("_", Path(filename).stem)[:60] or "evidence"
        stored_name = f"{uuid.uuid4().hex}_{safe_stem}{suffix}"
        path = directory / stored_name
        await asyncio.to_thread(path.write_bytes, data)

        return StoredFile(
            original_name=filename[:255],
            stored_path=str(path),
            size=len(data),
            mime_type=content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream",
        )

    async def delete(self, stored_path: str | None) -> None:
        if not stored_path:
            return
        path = Path(stored_path)
        try:
            root = Path(settings.upload_dir).resolve()
            if root in path.resolve().parents or path.resolve() == root:
                await asyncio.to_thread(path.unlink, missing_ok=True)
        except OSError:
            pass


storage_service = StorageService()
