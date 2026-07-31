# Implementation Status

## Completed

- Phase 0 project scaffold: Express, Prisma, Postgres, Docker Compose, env validation, Swagger, health route, cache utility.
- Phase 1 NAMASTE ingestion: `NamasteConcept`, CSV loader, sample CSV, FHIR `CodeSystem`, Zod validation, route, tests.
- Phase 2 ICD-11 sync foundation: WHO ICD API client, token cache, retry/backoff, sample sync, live-sync discovery flow, TM2/biomedicine `CodeSystem` routes, admin sync endpoint, tests.
- Phase 3 ConceptMap: `NamasteTm2Mapping`, sample mapping seed, FHIR `ConceptMap`, route, mapping suggester, tests.
- Phase 4 terminology operations: `$expand`, `$lookup`, `$translate`, autocomplete cache, validation middleware, FHIR `ValueSet`/`Parameters` responses, tests.
- Phase 5 auth/RBAC/audit: OAuth2-shaped JWT prototype, RBAC middleware, `AuditLog`, audit middleware, `/auth/mock-token`, protected FHIR/admin routes, tests.
- Phase 6 clinical write path: FHIR Bundle ingestion, consent requirement, NAMASTE validation, TM2 auto-population, append-only Problem List versioning, patient self-read checks, tests.
- Phase 7 compliance pass: FHIR compliance tests, protected route coverage, sample dump script, audit coverage script, `COMPLIANCE.md`, Swagger bearer auth metadata.
- Manual testing hardening: FHIR sample dumps now separate executable Bundle request payloads from response/resource examples; Swagger `/fhir/Bundle` uses the same NAMASTE-only fixture covered by integration tests.
- Phase 8 frontend: CodeSutra Next.js + Tailwind UI with demo token login, role switcher, `$expand` search, visible TM2 suggestions, Bundle submission, Problem List history view, and a dark tech/herbs theme.
- Phase 9 integration/demo packaging: Docker Compose frontend/API/Postgres stack, idempotent demo seed script, ADMIN-only `/admin/demo-reset`, CodeSutra README with architecture and traceability, `DEMO_SCRIPT.md`, and `BACKUP_RECORDING.md`.
- Test safety hardening: Jest now uses `.env.test` / `TEST_DATABASE_URL` and refuses non-test DB URLs.
- Admin sync validation: `POST /admin/sync/icd11` accepts only `source=sample` or `source=live`; invalid explicit values return HTTP 400.

## Completed

- Fresh full Docker Compose rehearsal: `docker compose up --build` brings up Postgres 16, API (Node 20-slim), and Frontend (Node 20 Alpine). All 3 containers build and start. Smoke tests verified:
  - Health endpoint: `200 OK`
  - Demo seed: 5 NAMASTE concepts, 4 ICD-11 TM2 concepts, 5 mappings
  - CodeSystem, ConceptMap, ValueSet/$expand routes respond correctly
  - $lookup returns correct code details
  - $translate works with `application/fhir+json` content type (express.json() configured to accept FHIR content type)
  - Frontend Next.js dev server serves on port 3001
  - Swagger docs at `/docs` accessible
- Fixed Dockerfile base image from `node:20-alpine` to `node:20-slim` to resolve Prisma OpenSSL detection issue on newer Alpine versions.

## Known Blockers
- Live WHO sync needs real WHO ICD API credentials. Current demo credentials return `invalid_client`.
- Mapping CSV currently has 5 demo mappings; expand to 15-100 mappings for final submission quality.
