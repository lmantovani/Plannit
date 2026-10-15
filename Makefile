# Plannit — Comandos de Desenvolvimento
# Uso: make <comando>

.PHONY: help setup dev build start typecheck lint format test migrate seed db-up db-down db-logs db-shell

help:
	@echo "Comandos disponíveis:"
	@echo "  make setup        — Prepara o ambiente (.env e chaves)"
	@echo "  make dev          — Inicia o servidor de desenvolvimento (HMR)"
	@echo "  make build        — Compila o projeto AdonisJS + React/Vite para produção"
	@echo "  make start        — Inicia o servidor de produção compilado"
	@echo "  make typecheck    — Executa verificação de tipos TypeScript"
	@echo "  make lint         — Executa o linter (ESLint)"
	@echo "  make format       — Formata o código com Prettier"
	@echo "  make test         — Executa a suíte de testes funcionais (Japa)"
	@echo "  make migrate      — Aplica as migrations no banco de dados"
	@echo "  make seed         — Executa os seeders de dados padrão"
	@echo "  make db-up        — Sobe o PostgreSQL no Docker em background"
	@echo "  make db-down      — Para o container do PostgreSQL"
	@echo "  make db-logs      — Visualiza logs do PostgreSQL no Docker"
	@echo "  make db-shell     — Abre o terminal psql dentro do container"

setup:
	cp -n .env.example .env || true
	npm install
	node ace generate:key

dev:
	npm run dev

build:
	npm run build

start:
	node --env-file=.env build/bin/server.js

typecheck:
	npm run typecheck

lint:
	npm run lint

format:
	npm run format

test:
	node ace test functional

migrate:
	node ace migration:run

seed:
	node ace db:seed

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

db-shell:
	docker compose exec -it postgres psql -U postgres -d plannit
