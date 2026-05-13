# Líder Móveis — Comandos de Desenvolvimento
# Uso: make <comando>

.PHONY: help setup backend frontend seed

help:
	@echo "Comandos disponíveis:"
	@echo "  make setup      — Instala todas as dependências (backend + frontend)"
	@echo "  make backend    — Inicia o servidor FastAPI em modo dev"
	@echo "  make frontend   — Inicia o servidor Vite (React)"
	@echo "  make seed       — Popula o banco com dados iniciais"
	@echo "  make dev        — Inicia backend + frontend em paralelo"

setup:
	@echo "→ Instalando backend..."
	cd backend && python -m venv venv && ./venv/bin/pip install -r requirements.txt
	@echo "→ Instalando frontend..."
	cd frontend && npm install
	@echo "→ Criando .env do backend..."
	cd backend && cp -n .env.example .env || true
	@echo "✅ Setup concluído. Configure backend/.env antes de rodar."

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

seed:
	cd backend && python seed.py

dev:
	@echo "Iniciando backend e frontend em paralelo..."
	make -j2 backend frontend
