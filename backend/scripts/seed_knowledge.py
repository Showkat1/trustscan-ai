from __future__ import annotations

import argparse
import asyncio

from app.core.db import SessionLocal, init_models
from app.services.rag import knowledge_base


async def main(force: bool) -> None:
    await init_models()
    async with SessionLocal() as session:
        result = await knowledge_base.index_documents(session, force=force)
    print(f"Knowledge base indexed: {result}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index the TrustScan knowledge base")
    parser.add_argument("--force", action="store_true", help="Re-embed unchanged documents")
    args = parser.parse_args()
    asyncio.run(main(args.force))
