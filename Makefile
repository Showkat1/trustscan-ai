.DEFAULT_GOAL := help

# ---------------------------------------------------------------------------
# TrustScan AI — developer commands
# ---------------------------------------------------------------------------

.PHONY: help install dev-api dev-web test lint format typecheck build \
        up down logs ps migrate revision seed cleanup reset

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install backend and frontend dependencies
	cd backend && uv sync --extra dev
	cd frontend && npm ci

dev-api: ## Run the FastAPI server with reload on :8000
	cd backend && uv run uvicorn app.main:app --reload --port 8000

dev-web: ## Run the Next.js dev server on :3000
	cd frontend && npm run dev

test: ## Run backend tests
	cd backend && uv run pytest -q

lint: ## Lint backend and frontend
	cd backend && uv run ruff check app tests scripts
	cd frontend && npx eslint .

format: ## Auto-fix backend lint issues
	cd backend && uv run ruff check app tests scripts --fix

typecheck: ## Type-check the frontend
	cd frontend && npx tsc --noEmit

build: ## Production build of the frontend
	cd frontend && npm run build

up: ## Start the full stack with Docker Compose
	docker compose up --build -d

down: ## Stop the stack (keeps volumes)
	docker compose down

logs: ## Follow stack logs
	docker compose logs -f --tail=100

ps: ## Show stack status
	docker compose ps

migrate: ## Apply database migrations
	cd backend && uv run alembic upgrade head

revision: ## Create a migration (make revision m="message")
	cd backend && uv run alembic revision --autogenerate -m "$(m)"

seed: ## Seed the demo user, knowledge base and sample investigations
	cd backend && uv run python -m scripts.seed_demo

cleanup: ## Delete investigations older than the retention window
	cd backend && uv run python -m scripts.cleanup

reset: ## Remove the stack and its volumes (destructive)
	docker compose down -v
