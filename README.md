# NAMASTE ICD-11 Terminology Service

FHIR R4 terminology microservice for NAMASTE and ICD-11 TM2 dual coding.

## Current Status

Phase 0 scaffold is in place:

- Express API with `/health`
- Environment validation with Zod
- Swagger UI at `/docs`
- Prisma PostgreSQL datasource
- Docker Compose for API and Postgres
- In-memory TTL cache utility

## Quick Start

```bash
cp .env.example .env
npm install
docker-compose up --build
```

The API starts on `http://localhost:3000`.

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The demo UI runs on `http://localhost:3001` and expects the API at `http://localhost:3000`.

## Endpoints

- `GET /health`
- `GET /docs`
