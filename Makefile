# Líder Móveis — Comandos de Desenvolvimento
# Uso: make <comando>

.PHONY: help setup backend frontend seed dev adonis-dev adonis-build adonis-start adonis-typecheck db-up db-down db-logs db-shell adonis-migrate adonis-seed

help:
	@echo "Comandos disponíveis:"
	@echo "  make db-up            — Sobe o PostgreSQL no Docker em background"
	@echo "  make db-down          — Para o container do PostgreSQL"
	@echo "  make db-logs          — Visualiza logs do PostgreSQL no Docker"
	@echo "  make db-shell         — Abre o terminal psql dentro do container"
	@echo "  make adonis-dev       — Inicia o monolito AdonisJS v7 + Inertia (novo)"
	@echo "  make adonis-build     — Compila o projeto AdonisJS + React/Vite para produção"
	@echo "  make adonis-typecheck — Executa verificação de tipos TypeScript"
	@echo "  make adonis-migrate   — Executa as migrations no PostgreSQL"
	@echo "  make adonis-seed      — Popula os usuários padrão de teste no PostgreSQL"
	@echo "  make setup            — Instala dependências do stack legado (backend + frontend)"
	@echo "  make dev              — Inicia backend + frontend legados em paralelo"


setup:
	@echo "→ Instalando backend..."
	cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
	@echo "→ Instalando frontend..."
	cd frontend && npm install
	@echo "→ Criando .env do backend..."
	cd backend && cp -n .env.example .env || true
	@echo "✅ Setup concluído. Configure backend/.env antes de rodar."

backend:
	cd backend && ./venv/bin/uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

seed:
	cd backend && ./venv/bin/python3 seed.py

dev:
	@echo "Iniciando backend e frontend em paralelo..."
	make -j2 backend frontend

adonis-dev:
	cd plannit && npm run dev

adonis-build:
	cd plannit && npm run build

adonis-start:
	cd plannit && node --env-file=.env build/bin/server.js

adonis-typecheck:
	cd plannit && npm run typecheck

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

db-shell:
	docker compose exec -it postgres psql -U postgres -d plannit

adonis-migrate:
	cd plannit && node ace migration:run

adonis-seed:
	cd plannit && node ace db:seed



