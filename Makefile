############################################
#  Makefile docker compose + Swarm
############################################

.PHONY: up down prismaUp test test-watch test-e2e test-cov test-load test-load-report

up:
	@echo "Lancement de l'application en utilisant docker compose..."
	docker compose up
	@echo "Application demarree en mode local."

upd:
	@echo "Lancement de l'application en utilisant docker compose..."
	docker compose up -d
	@echo "Application demarree detachée."

build:
	@echo "Lancement de l'application en utilisant docker compose..."
	docker compose build && docker compose up
	@echo "Application build and up."

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
