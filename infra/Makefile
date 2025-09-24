# Makefile com comandos de conveniência

.PHONY: help dev-up dev-down test migrate build

help:
	@echo "Comandos disponíveis:"
	@echo "  make dev-up        - Sobe os serviços via docker-compose"
	@echo "  make dev-down      - Desce os serviços"
	@echo "  make migrate       - Executa migrações SQL no contêiner do banco"
	@echo "  make test          - Executa testes unitários"
	@echo "  make build         - Constrói a imagem do backend"

dev-up:
	docker-compose -f infra/docker-compose.yml up -d --build

dev-down:
	docker-compose -f infra/docker-compose.yml down

migrate:
	# Executa os scripts de migração dentro do banco
	docker-compose -f infra/docker-compose.yml exec -T db psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f /docker-entrypoint-initdb.d/001_create_tables.sql
	docker-compose -f infra/docker-compose.yml exec -T db psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f /docker-entrypoint-initdb.d/002_adjust_tables.sql
	docker-compose -f infra/docker-compose.yml exec -T db psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f /docker-entrypoint-initdb.d/003_create_articles.sql

test:
	pytest -q

build:
	docker-compose -f infra/docker-compose.yml build api