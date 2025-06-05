# Technidalle Project

This repository contains multiple NestJS microservices and related components.

## Running tests

Each service has its own `package.json` and test suite. To run the tests for a specific service:

```bash
cd Backend/<service_name>
npm install
npm run test
```

Replace `<service_name>` with the desired service directory, e.g. `resources_service` or `sync_service`.

## Docker

The project provides a `docker-compose.yml` to start all services and dependencies.
Run:

```bash
docker-compose up --build
```

This will start PostgreSQL, Elasticsearch and all microservices.
