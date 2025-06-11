############################################
#  Makefile docker compose + Swarm
############################################

.PHONY: up down build buildd prismaUp test test-watch test-e2e test-cov test-load test-load-report build-mcp start-mcp clean-mcp check-mcp build-all up-all

up:
	@echo "Lancement de l'application en utilisant docker compose..."
	docker compose up
	@echo "Application demarree en mode local."

upd:
	@echo "Lancement de l'application en utilisant docker compose..."
	docker compose up -d
	@echo "Application demarree detachée."

build: build-mcp
	@echo "🏗️ Construction du serveur MCP et lancement de l'application..."
	docker compose build && docker compose up
	@echo "✅ Application et serveur MCP construits et démarrés."

buildd: build-mcp
	@echo "🏗️ Construction du serveur MCP et lancement de l'application en mode détaché..."
	docker compose build && docker compose up -d
	@echo "✅ Application et serveur MCP construits et démarrés en arrière-plan."

down:
	@echo "Arret de l'application en utilisant docker compose..."
	docker compose down
	@echo "Application arretee."

down++:
	@echo "Arret de l'application et suppression des volumes et orphelins en utilisant docker compose..."
	docker compose down --volumes --remove-orphans
	@echo "Application arretee et volumes supprimes."

ifeq ($(OS),Windows_NT)
artillery-clean:
	@IF EXIST "Backend\artillery\scenarios\artillery.json" del /F /Q "Backend\artillery\scenarios\artillery.json"
else
artillery-clean:
	rm -f Backend/artillery/scenarios/artillery.json
endif

artillery: artillery-clean
	cd Backend && \
	artillery run artillery/scenarios/artillery.yml -o artillery/scenarios/artillery.json && \
	artillery report artillery/scenarios/artillery.json

prismaUp:
	@echo "Mise a jour des schemas Prisma dans tous les services..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File updatePrisma.ps1
else
	bash updatePrisma.sh
endif
	@echo "Mise a jour Prisma terminee."


# Jest tests
test:
	npm run test

test-watch:
	npm run test:watch

test-e2e:
	npm run test:e2e

test-cov:
	npm run test:cov

# Artillery load tests
test-load:
	npx artillery run artillery.yaml

test-load-report:
	npx artillery run artillery.yaml --output report.json
	npx artillery report --output report.html report.json

# MCP Server commands
build-mcp:
	@echo "🏗️ Construction du serveur MCP PostgreSQL..."
	cd mcp-postgres-server && npm install && npm run build
	@echo "✅ Serveur MCP PostgreSQL construit avec succès!"

clean-mcp:
	@echo "🧹 Nettoyage du serveur MCP PostgreSQL..."
	cd mcp-postgres-server && npm run clean

start-mcp: build-mcp
	@echo "🚀 Démarrage du serveur MCP PostgreSQL..."
	cd mcp-postgres-server && npm start

check-mcp:
	@echo "🔍 Vérification de l'état du serveur MCP..."
	@if [ -f "mcp-postgres-server/dist/index.js" ]; then \
		echo "✅ Serveur MCP compilé et prêt"; \
	else \
		echo "❌ Serveur MCP non compilé. Exécutez 'make build-mcp'"; \
		exit 1; \
	fi

# Updated docker commands to include MCP server
build-all: build-mcp
	@echo "🏗️ Construction de tous les services..."
	docker-compose build

up-all: build-mcp
	@echo "🚀 Démarrage de tous les services (incluant MCP)..."
	docker-compose up -d
