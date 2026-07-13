# NAMASTE ↔ ICD-11 (TM2) FHIR Terminology Microservice
## Implementation Plan, Phase Planner & AI Build Prompts

## Current Implementation Status

- [x] Phase 0: Project scaffold, Express API, Prisma/Postgres, Docker Compose, env validation, Swagger, health route, cache utility.
- [x] Phase 1: NAMASTE CSV ingestion, `NamasteConcept`, sample CSV, FHIR `CodeSystem`, Zod validation, route, tests.
- [x] Phase 2: ICD-11 sync foundation, WHO client, token cache, retry/backoff, sample sync, live discovery flow, TM2/biomedicine `CodeSystem` routes, admin sync endpoint, tests.
- [x] Phase 3: NAMASTE-to-TM2 mapping model, seed script, demo mapping CSV, FHIR `ConceptMap`, route, mapping suggester, tests.
- [x] Test safety hardening: Jest uses `.env.test` / `TEST_DATABASE_URL` and refuses non-test DB URLs.
- [x] Admin sync validation: `POST /admin/sync/icd11` accepts only `source=sample` or `source=live`; invalid explicit values return HTTP 400.
- [x] Phase 4: Core terminology operations implemented: `$expand`, `$lookup`, `$translate`, cache, validation, and tests.
- [x] Phase 5: JWT prototype auth, RBAC, `AuditLog`, audit middleware, mock-token route, route protection, and tests.
- [x] Phase 6: Clinical Bundle ingestion, dual-coded Problem List persistence, versioning, consent checks, patient self-read checks, and tests.
- [x] Phase 7: Compliance validation tests, auth coverage tests, FHIR sample dump script, audit coverage script, and `COMPLIANCE.md`.
- [x] Manual testing workflow: executable Bundle request samples separated from response examples, Swagger Bundle request body example fixed, bearer-auth OpenAPI verified.
- [x] Phase 8: Minimal Next.js + Tailwind frontend implemented with mock login, dual-code search, Bundle submission, and Problem List viewing.
- [ ] Phase 9: Not started.

Problem Statement: **SIH 25026** — Ministry of Ayush / AIIA

---

## 1. What you're actually building

Strip away the jargon and this is **five things wired together**:

1. A **database of codes**: NAMASTE (Ayurveda/Siddha/Unani terms) + ICD-11 TM2 + ICD-11 Biomedicine, stored as FHIR `CodeSystem` resources (plain FHIR R4 JSON), with a `ConceptMap` linking NAMASTE → TM2.
2. A **sync job** that pulls live TM2/Biomedicine data from the WHO ICD-11 API and refreshes your local store.
3. A **terminology API** (FHIR operations): autocomplete search, `$translate` (NAMASTE↔TM2), `$lookup`.
4. A **clinical data API**: accept a FHIR `Bundle`/`Condition` with dual codes and store it as a patient `Problem List` entry, with consent + audit metadata.
5. **Security**: OAuth 2.0 architecture with a JWT prototype standing in for ABHA tokens, plus role-based access control (ISO 22600 intent).

The frontend (Phase 8) is just a thin search-and-submit UI over #3 and #4 — deliberately last, because the backend is where all the marks (and all the real complexity) are.

## 2. Tech stack (as specified)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | **Node.js** | |
| Backend framework | **Express.js** | |
| Language | **JavaScript** | plain JS, no TS build step — keep it fast for a hackathon timeline |
| Database | **PostgreSQL** | |
| ORM | **Prisma** | schema-first, generates a type-safe client even in JS via JSDoc |
| FHIR handling | **FHIR R4 JSON** | no FHIR library — resources are built/validated as plain JSON objects against the R4 spec shape you define yourself (schema-checked with Zod) |
| HTTP client | **Axios** | used for calling the WHO ICD-11 API |
| CSV parsing | **csv-parser / fast-csv** | for NAMASTE CSV ingestion |
| Authentication | **OAuth 2.0 architecture + JWT prototype** | JWT stands in for ABHA-issued tokens during the hackathon; structured so a real ABHA OAuth2 flow can be swapped in later |
| Validation | **Zod** | validates request bodies, FHIR resource shapes, and env config |
| API documentation | **OpenAPI / Swagger** | via `swagger-jsdoc` + `swagger-ui-express` |
| Testing | **Jest + Supertest** | unit + HTTP integration tests |
| Frontend | **Next.js + Tailwind** | Phase 8 only |
| Deployment | **Docker** | Docker Compose: api + postgres (+ redis if you want caching — optional, not in the mandated stack, see note below) |

**Note on caching:** Redis isn't in your specified stack, so autocomplete/token caching in the plan below uses an **in-memory cache (a simple `Map` with TTL, or `node-cache`)** instead. This is fine for a demo; call it out as a scaling limitation in your README (swap to Redis in production).

## 3. Architecture at a glance

```
NAMASTE CSV ──▶ [Ingestion Service: csv-parser] ──▶ CodeSystem(NAMASTE) ──┐
                                                                            ├──▶ ConceptMap(NAMASTE→TM2) ──▶ Postgres (Prisma)
WHO ICD-11 API ──▶ [Sync Service: Axios] ──▶ CodeSystem(TM2, Biomedicine) ─┘

Postgres ──▶ [Terminology API: $lookup, ValueSet/$expand, $translate] ──▶ Clients
Postgres ──▶ [Clinical API: Bundle upload → ProblemList] ──▶ EMR
[Auth Middleware: JWT (OAuth2/ABHA-shaped) + RBAC (ISO 22600) + Audit Log] wraps all of the above
[Frontend: Next.js + Tailwind — search widget + problem list builder] ──▶ Terminology API + Clinical API
```

---

## 4. Phased To-Do Planner

Ten phases. Backend/functionality first (Phases 0–7), frontend last (Phase 8), polish/demo last (Phase 9). Each phase has a checklist and a ready-to-paste prompt for an AI coding assistant (Claude Code, Cursor, etc.).

---

### Phase 0 — Setup & Data Reconnaissance
**Goal:** Know your inputs and have a runnable skeleton before writing business logic.

- [x] Get/simulate a NAMASTE CSV export (columns: code, term, native/Devanagari term, short definition, Ayurveda/Siddha/Unani category)
- [ ] Register for WHO ICD-API access (client_id/client_secret at https://icd.who.int/icdapi) — confirm scope covers TM2 (Chapter 26) and Biomedicine
- [x] Scaffold the Express + Prisma + Postgres + Docker Compose project
- [x] Decide folder structure up front (routes / controllers / services / prisma / middleware / lib)

**Prompt:**
```
Set up a new backend project for a FHIR R4 terminology microservice.
Stack: Node.js, Express.js, JavaScript (no TypeScript), PostgreSQL, Prisma ORM, Docker Compose.
Requirements:
1. Project structure:
   /src
     /routes
     /controllers
     /services
     /middleware
     /lib
     /config
   /prisma (schema.prisma, migrations/)
   /tests
   /data (sample CSVs)
   docker-compose.yml (api + postgres), Dockerfile, .env.example, package.json, README.md
2. Initialize Prisma with a PostgreSQL datasource reading DATABASE_URL from env.
3. Express app with: JSON body parsing, CORS, a /health endpoint, centralized error-handling middleware, and a request logger (morgan).
4. Config module (src/config/env.js) using Zod to validate required env vars at boot: DATABASE_URL, WHO_ICD_CLIENT_ID, WHO_ICD_CLIENT_SECRET, WHO_ICD_API_BASE, JWT_SECRET, JWT_EXPIRY, PORT. Fail fast with a clear error if any are missing.
5. Simple in-memory TTL cache utility at src/lib/cache.js (Map-based, with set(key, value, ttlMs) and get(key) that returns undefined after expiry) — this substitutes for Redis, used later for token/autocomplete caching.
6. Set up swagger-jsdoc + swagger-ui-express serving live docs at /docs, wired to auto-read JSDoc @openapi comments from route files (empty for now).
Do not implement business logic yet — just a clean, runnable skeleton where `docker-compose up` starts the API and connects to Postgres.
```

---

### Phase 1 — NAMASTE Ingestion → FHIR CodeSystem
**Goal:** Turn the raw NAMASTE CSV into a queryable, versioned FHIR `CodeSystem` (plain FHIR R4 JSON).

- [x] Define Prisma model `NamasteConcept` (code, display, definition, category, nativeTerm, version, effectiveDate)
- [x] Write a CSV → DB loader script using csv-parser/fast-csv
- [x] Build a service that assembles a valid FHIR R4 `CodeSystem` JSON object from the DB rows (url, version, status, content=complete, concept[])
- [x] Validate the assembled CodeSystem shape with a Zod schema you define for FHIR CodeSystem (fields required by R4: resourceType, status, content, concept[].code/display)
- [x] Add `GET /fhir/CodeSystem/namaste`
- [x] Jest test: ingest a small sample CSV, assert the resulting CodeSystem JSON passes the Zod schema and has the right concept count

**Prompt:**
```
Implement NAMASTE CSV ingestion for the FHIR terminology microservice (Express + Prisma + JS).

1. Add a Prisma model NamasteConcept: id (autoincrement), code (unique, String), display, definition, category (String enum-like: "ayurveda" | "siddha" | "unani", enforce via Zod not DB enum for flexibility), nativeTerm, version, effectiveDate (DateTime), createdAt (default now). Generate and run the migration.
2. Write src/scripts/ingestNamaste.js: a Node CLI script (run via `node src/scripts/ingestNamaste.js <csvPath>`) that streams the CSV with csv-parser, validates each row against a Zod schema (required: code, display, category in [ayurveda,siddha,unani]), and upserts into NamasteConcept via Prisma (`prisma.namasteConcept.upsert`). Log a summary at the end: rows added, updated, skipped (with reasons for skips).
3. Write src/services/codeSystemBuilder.js exporting buildNamasteCodeSystem() that queries all NamasteConcept rows via Prisma and returns a plain JS object shaped as a FHIR R4 CodeSystem resource:
   { resourceType: "CodeSystem", url, version, status: "active", content: "complete", concept: [{ code, display, definition, property: [{ code: "category", valueString }] }] }
4. Define src/schemas/fhirCodeSystem.schema.js — a Zod schema validating the minimum required shape of a FHIR R4 CodeSystem (resourceType literal, status enum, content enum, concept array with code/display required). Use it to self-validate buildNamasteCodeSystem()'s output before returning it (throw a clear error if invalid — this should never happen in practice, it's a safety net).
5. Add GET /fhir/CodeSystem/namaste in src/routes/codeSystem.routes.js calling the service and returning the JSON with Content-Type application/fhir+json. Add an @openapi JSDoc comment for Swagger.
6. Create a 5-row sample CSV fixture in /data and a tests/ingestNamaste.test.js (Jest + Supertest) that ingests it and asserts GET /fhir/CodeSystem/namaste returns 5 concepts and passes the Zod schema.
Handle malformed CSV rows by logging and skipping, not crashing the ingest.
```

---

### Phase 2 — WHO ICD-11 API Sync (TM2 + Biomedicine)
**Goal:** Pull live ICD-11 TM2 (Chapter 26) and Biomedicine entities via Axios and cache them locally.

- [x] Axios-based WHO ICD-API client: OAuth2 client-credentials token fetch, cached in-memory until near-expiry
- [x] Sync job walking TM2 (Chapter 26) and a configurable Biomedicine subset, storing code/title/definition/parent hierarchy in Postgres via Prisma
- [x] Build FHIR `CodeSystem` JSON for TM2 and Biomedicine from the synced rows
- [x] `GET /fhir/CodeSystem/icd11-tm2`, `GET /fhir/CodeSystem/icd11-biomedicine`
- [x] `POST /admin/sync/icd11` to trigger resync manually
- [x] Handle WHO API rate limits/pagination with retry + backoff (Axios interceptors)

**Prompt:**
```
Implement WHO ICD-11 API integration for TM2 and Biomedicine using Axios, into the existing Express service.

1. Create src/services/whoIcdClient.js: an Axios-based client that
   - fetches an OAuth2 client_credentials token from the WHO ICD-API token endpoint (icdaccessmanagement.who.int/connect/token) using WHO_ICD_CLIENT_ID/SECRET from config
   - caches the token in the in-memory cache util from Phase 0 with TTL slightly less than its actual expiry
   - exposes getEntity(uri) and searchEntities(query, linearization) methods, sending API-Version: v2 and Accept-Language: en headers as required by the ICD-11 API
   - uses an Axios interceptor for retry-with-backoff on 429/5xx responses
2. Add a Prisma model Icd11Concept: id, entityId (unique), code, title, definition, chapter ("tm2" | "biomedicine"), parentId, uri, createdAt. Migrate.
3. Create src/services/icd11Sync.js exporting syncIcd11() that:
   - walks ICD-11 Chapter 26 (TM2) entities
   - walks a configurable list of Biomedicine chapters/entities relevant to common Ayush comorbidities (diabetes, hypertension, etc.) — load this list from data/biomedicineTargets.json so it's editable without code changes
   - upserts each into Icd11Concept via Prisma (idempotent, safe to rerun)
   - logs progress (entities processed, failures)
4. Build src/services/icd11CodeSystemBuilder.js — same pattern as codeSystemBuilder.js from Phase 1, producing FHIR R4 CodeSystem JSON for tm2 and biomedicine chapters separately, validated with a Zod schema.
5. Add GET /fhir/CodeSystem/icd11-tm2, GET /fhir/CodeSystem/icd11-biomedicine, and POST /admin/sync/icd11 (leave auth as a TODO comment — wired in Phase 5). Add Swagger JSDoc.
6. Write tests/icd11Sync.test.js mocking Axios (use jest.mock or nock) to verify syncIcd11() writes expected rows without hitting the real WHO API.
```

---

### Phase 3 — ConceptMap: NAMASTE ↔ TM2 Dual Coding
**Goal:** The actual clinical value-add — mapping traditional terms to global codes.

- [x] Prisma model `NamasteTm2Mapping` (namasteCode, tm2Code, equivalence, notes, confidence, reviewedBy)
- [x] Seed initial hand-curated demo mappings via CSV (5 mappings now; expand to 15–100 for final submission)
- [x] Build FHIR `ConceptMap` JSON from the mapping table
- [x] `GET /fhir/ConceptMap/namaste-to-tm2`
- [x] Optional stretch: simple token-overlap similarity suggester (human-reviewed only, never auto-applied)

**Prompt:**
```
Implement the NAMASTE ↔ ICD-11 TM2 ConceptMap.

1. Add Prisma model NamasteTm2Mapping: id, namasteCode, tm2Code, equivalence ("equivalent"|"wider"|"narrower"|"relatedto"|"unmatched" — validate via Zod, store as String), notes, confidence (Float), reviewedBy, createdAt. Migrate.
2. Write src/scripts/seedMappings.js: reads a CSV (namaste_code,tm2_code,equivalence,notes) with csv-parser and upserts into NamasteTm2Mapping. Create data/sample-mappings.csv with ~15 realistic Ayurveda-term-to-TM2 mappings, using "relatedto" or "wider" (not "equivalent") wherever it's not a genuine 1:1 match.
3. Write src/services/conceptMapBuilder.js exporting buildNamasteToTm2ConceptMap() that queries NamasteTm2Mapping via Prisma and returns FHIR R4 ConceptMap JSON:
   { resourceType: "ConceptMap", sourceUri, targetUri, group: [{ source, target, element: [{ code, target: [{ code, display, equivalence, comment }] }] }] }
   Validate against a Zod schema for the minimum ConceptMap shape.
4. Add GET /fhir/ConceptMap/namaste-to-tm2 with Swagger JSDoc.
5. Add src/services/mappingSuggester.js exporting suggestMappingCandidates(namasteCode) that does simple token-overlap scoring between a NAMASTE concept's display+definition and all Icd11Concept (tm2) rows, returning top-5 candidates with a score. Add a clear comment: this is a human-review suggestion tool only, results are never written to NamasteTm2Mapping automatically.
6. Write tests/conceptMap.test.js validating the generated ConceptMap structure and that equivalence values are constrained to the allowed set.
```

---

### Phase 4 — Core Terminology Operations (Autocomplete, Lookup, Translate)
**Goal:** The FHIR operations everything else depends on.

- [x] `GET /fhir/ValueSet/$expand?filter=<term>` — autocomplete across NAMASTE + TM2 + Biomedicine, dual results
- [x] `GET /fhir/CodeSystem/$lookup?system=...&code=...` — full detail for a single code
- [x] `POST /fhir/ConceptMap/$translate` — NAMASTE ↔ TM2 translation
- [x] In-memory cache on autocomplete (short TTL)
- [x] All responses shaped as proper FHIR resources (`ValueSet`, `Parameters`, `OperationOutcome`), validated with Zod schemas

**Prompt:**
```
Implement the three core FHIR terminology operations (Express + Prisma).

1. GET /fhir/ValueSet/$expand?filter={text}&count={n}
   - query NamasteConcept and Icd11Concept (both tm2 and biomedicine) via Prisma using case-insensitive `contains` filters on display/definition/nativeTerm (use Prisma's `mode: "insensitive"`)
   - build and return a FHIR R4 ValueSet JSON: { resourceType: "ValueSet", expansion: { total, contains: [{ system, code, display }] } }, tagging each result with its source system URL (namaste / icd11-tm2 / icd11-biomedicine)
   - cache the result in the in-memory cache keyed by `filter+count` for 60 seconds
   - validate output shape with a Zod ValueSet schema
2. GET /fhir/CodeSystem/$lookup?system={system}&code={code}
   - return a FHIR Parameters resource: { resourceType: "Parameters", parameter: [{ name: "display", valueString }, { name: "definition", valueString }, ...] } for the matched code from whichever table matches the system URL
   - if not found, return a FHIR OperationOutcome with 404
3. POST /fhir/ConceptMap/$translate
   - body: { system, code, targetSystem? } validated with Zod
   - look up NamasteTm2Mapping in both directions (namasteCode->tm2Code and reverse)
   - return FHIR Parameters: { parameter: [{ name: "result", valueBoolean }, { name: "match", part: [{ name: "equivalence", valueCode }, { name: "concept", valueCoding: { system, code, display } }] }] }
   - if unmapped, return result=false with an informative OperationOutcome-style message, not an HTTP error
4. Add all three routes with Swagger JSDoc and Zod-based request validation middleware (reusable validateRequest(schema) middleware in src/middleware/validate.js).
5. Write tests/terminologyOps.test.js (Jest + Supertest) covering: autocomplete returns results from both code systems for an ambiguous query, $lookup returns correct detail and 404s cleanly, $translate returns correct mapping in both directions and handles unmapped codes gracefully.
```

---

### Phase 5 — Auth: OAuth 2.0 Architecture + JWT Prototype + RBAC + Audit Trail
**Goal:** Nothing above is compliant without this. Do it before the clinical write endpoint.

- [x] JWT issuance/validation designed to mirror an OAuth2/ABHA token shape (`sub`=ABHA id, `role`, `facility_id`), with a clean seam to swap in real ABHA later
- [x] RBAC middleware implementing an ISO-22600-style permission matrix (clinician/coder/patient/admin)
- [x] Prisma `AuditLog` model + middleware logging every `/fhir/*` request
- [x] `POST /auth/mock-token` (clearly demo-only) issuing prototype JWTs
- [x] Wire `requireRole(...)` onto every route from Phases 1–4 and the upcoming Phase 6

**Prompt:**
```
Implement authentication (OAuth2-shaped JWT prototype), RBAC, and audit logging.

1. Create src/lib/jwt.js using `jsonwebtoken`: signToken(payload, expiresIn) and verifyToken(token). Payload shape mirrors an OAuth2/ABHA access token: { sub: abhaId, role, facilityId }. Add a comment explaining this HS256 JWT is a prototype standing in for ABHA's real OAuth2 (RS256/JWKS) flow, and note where a production swap would happen (verifyToken would call a JWKS endpoint instead of a shared secret).
2. Create src/middleware/auth.js: requireAuth (extracts Bearer token, verifies, attaches req.user = {abhaId, role, facilityId}, 401 on failure) and requireRole(...roles) (403 if req.user.role not in roles).
3. Create src/lib/rbac.js documenting the ISO-22600-style permission matrix as a constant object:
   - CLINICIAN: read terminology, read/write own facility's ProblemList entries
   - CODER: read terminology, read ProblemList entries, no write
   - PATIENT: read only their own ProblemList entries (enforced at the controller level via consent/self-check, not just role)
   - ADMIN: full access + trigger ICD-11 sync
4. Add Prisma model AuditLog: id, actorAbhaId, role, action, resourceType, resourceId, outcome, consentStatus, timestamp (default now). Migrate.
5. Create src/services/audit.js exporting logAccess(...), and src/middleware/auditLogger.js — Express middleware that calls logAccess after every /fhir/* request completes (actor from req.user, action from HTTP method, resource from req.path, outcome from res.statusCode).
6. Add POST /auth/mock-token accepting { abhaId, role, facilityId } (Zod-validated), returning a signed JWT. Mark clearly in code comments and Swagger docs as DEMO ONLY — not for production.
7. Retrofit requireAuth + requireRole onto all existing /fhir/* routes (read routes: any authenticated role; POST /admin/sync/icd11: ADMIN only).
8. Write tests/auth.test.js: unauthenticated request → 401; PATIENT hitting a write route → 403; valid CLINICIAN token → 200; confirm an AuditLog row is created for each request.
```

---

### Phase 6 — Clinical Write Path: FHIR Bundle Upload → Problem List (Dual Coding)
**Goal:** Where NAMASTE + TM2 codes actually land in a patient record — the demo centerpiece.

- [x] Prisma model `ProblemListEntry` (patientAbhaId, namasteCode, tm2Code, biomedicineCode?, clinicalStatus, recordedBy, recordedAt, consentId, version, isCurrent)
- [x] `POST /fhir/Bundle` — accept a FHIR `Bundle` (transaction) with a `Condition` carrying NAMASTE (+ optionally TM2/Biomedicine) codings; validate codes exist, validate consent present, persist
- [x] Auto-populate TM2 coding via the Phase 4 `$translate` logic when only NAMASTE was submitted (this is the double-coding requirement)
- [x] Version tracking: append-only, `isCurrent` flag, never overwrite
- [x] `GET /fhir/Patient/{abhaId}/ProblemList` with optional `?includeHistory=true`
- [x] Consent metadata required on every write, logged in audit trail

**Prompt:**
```
Implement the clinical write path: FHIR Bundle ingestion into a dual-coded Problem List.

1. Add Prisma model ProblemListEntry: id, patientAbhaId, namasteCode, tm2Code, biomedicineCode (nullable), displayText, clinicalStatus ("active"|"resolved"|"inactive"), recordedByAbhaId, recordedAt, consentId, version (Int), isCurrent (Boolean, default true), createdAt. Migrate.
2. Implement POST /fhir/Bundle (requireAuth, requireRole("CLINICIAN")):
   - Zod-validate the incoming body is shaped like a FHIR Bundle (resourceType: "Bundle", type: "transaction", entry: [...])
   - for each Condition resource in entry[]: require subject reference, at least one coding with system=namaste-url whose code exists in NamasteConcept, and a Consent resource reference present somewhere in the Bundle — else return a FHIR OperationOutcome 400
   - if the Condition's coding[] does not already include a tm2 coding, call the internal $translate service logic from Phase 4 directly (not over HTTP) to look up the TM2 equivalent and append it — if no mapping exists, proceed but include an OperationOutcome warning in the response instead of blocking
   - persist via Prisma transaction: mark any existing ProblemListEntry for the same patientAbhaId+namasteCode as isCurrent=false, insert the new row as isCurrent=true, version = previous version + 1 (or 1 if new)
   - call logAccess with the consentId included
   - return a FHIR Bundle transaction-response (201 per created entry)
3. Implement GET /fhir/Patient/:abhaId/ProblemList (requireAuth, requireRole("CLINICIAN","CODER","PATIENT")):
   - if req.user.role === "PATIENT", enforce req.params.abhaId === req.user.abhaId (403 otherwise)
   - return current entries as a FHIR Bundle of Condition resources with all codings, clinicalStatus, and recordedBy/recordedAt as extensions
   - support ?includeHistory=true to also return isCurrent=false rows
4. Write tests/problemList.test.js: (a) Bundle with only NAMASTE code auto-populates TM2 via translate, (b) missing consent → 400, (c) second submission for same patient+code versions correctly instead of overwriting, (d) PATIENT role cannot read another patient's ProblemList (403).
```

---

### Phase 7 — Compliance & Validation Pass
**Goal:** Prove EHR-2016-standard compliance before you build UI on top of a shaky base.

- [x] Zod-validate every generated FHIR resource (CodeSystem, ConceptMap, Bundle, Condition, Parameters, ValueSet, OperationOutcome) against schemas covering the R4 fields you actually rely on
- [x] Confirm any SNOMED CT/LOINC references use correctly namespaced system URIs (`http://snomed.info/sct`, `http://loinc.org`)
- [x] Basic load sanity-check on the autocomplete endpoint to confirm the in-memory cache is doing its job
- [x] Security review: every write route behind `requireAuth`/`requireRole`, audit log actually capturing everything, no secrets committed
- [x] Clean up Swagger/OpenAPI docs for a judge-facing demo

**Prompt:**
```
Add a compliance and validation test suite to the terminology microservice.

1. Write tests/fhirCompliance.test.js (Jest + Supertest) that:
   - fetches /fhir/CodeSystem/namaste, /fhir/CodeSystem/icd11-tm2, /fhir/CodeSystem/icd11-biomedicine, /fhir/ConceptMap/namaste-to-tm2
   - validates each against their respective Zod schemas (reuse the ones from Phases 1-3)
   - submits a sample Bundle to /fhir/Bundle and validates the response Bundle shape
2. Add src/scripts/dumpFhirSamples.js that writes all generated FHIR resources to /tmp/fhir_samples/*.json, with a README note on optionally validating them against the official HL7 FHIR validator jar (`java -jar validator_cli.jar <file> -version 4.0`).
3. Write tests/routeAuthCoverage.test.js that programmatically inspects the Express router stack (app._router.stack) and fails if any /fhir/* route (other than intentionally public GET CodeSystem/ValueSet reads) is missing the requireAuth middleware.
4. Write src/scripts/checkAuditCoverage.js that replays a scripted sequence of API calls against a running test server (via Axios) and asserts a matching AuditLog row exists in Postgres for each call.
5. Clean up all @openapi Swagger JSDoc blocks with realistic examples so /docs looks presentable.
Produce COMPLIANCE.md summarizing: FHIR R4 conformance approach (Zod-validated JSON, no full FHIR library), SNOMED CT/LOINC namespacing usage, ISO 22600 RBAC mapping, and known gaps (mock JWT vs real ABHA OAuth2 sandbox, in-memory cache vs Redis at scale).
```

---

### Phase 8 — Frontend (Deliberately Last)
**Goal:** Thin, demo-ready UI over the already-working backend, built with Next.js + Tailwind. Don't gold-plate this.

- [x] Search box hitting `$expand` with debounce, showing NAMASTE term + suggested TM2 code side by side (the "dual coding" money shot)
- [x] "Add to Problem List" → builds the FHIR Bundle client-side → `POST /fhir/Bundle`
- [x] Patient Problem List view (`GET /fhir/Patient/{id}/ProblemList`) with version history toggle
- [x] Mock login using the Phase 5 `/auth/mock-token` endpoint, with a role switcher (Clinician/Coder/Patient) for the demo
- [x] Clean but minimal Tailwind styling — functional over pretty

**Prompt:**
```
Build a minimal Next.js + Tailwind frontend for the terminology microservice, prioritizing function over polish.

1. Scaffold a Next.js (App Router) app in /frontend with Tailwind CSS configured. Use fetch/Axios against the backend API base URL from a public env var (NEXT_PUBLIC_API_BASE).
2. Build a LoginBar component (client component): dropdown to pick a demo role (Clinician/Coder/Patient), "Get Demo Token" button calling POST /auth/mock-token, storing the JWT + role in React Context, attached as Authorization: Bearer on all subsequent calls.
3. Build a DiagnosisSearch component:
   - debounced text input hitting GET /fhir/ValueSet/$expand?filter=...
   - render results in two visually distinct columns: "Traditional (NAMASTE)" and "ICD-11 TM2" (fetch the TM2 side via $translate if not already present in the expand result)
   - "Add to Problem List" button per result opening a small confirm modal (patient ABHA ID input), then POSTing a constructed FHIR Bundle to /fhir/Bundle
4. Build a ProblemList component: given a patient ABHA ID, calls GET /fhir/Patient/{abhaId}/ProblemList, renders current entries in a table (NAMASTE code/display, TM2 code/display, status, recorded date), with a toggle for ?includeHistory=true.
5. Keep it to a handful of pages/components — no state management library beyond React Context, no routing complexity beyond the App Router defaults, Tailwind utility classes only (no custom design system).
```

---

### Phase 9 — Integration, Demo Script & Packaging
**Goal:** Everything runs with one command and tells a clear story in 3 minutes.

- [ ] `docker-compose up` brings up API + Postgres (+ frontend) in one shot, with a seed step auto-running NAMASTE ingestion + ICD-11 sync (using a small cached sample TM2/Biomedicine JSON checked into the repo, so the demo doesn't depend on live WHO API access) + mapping seed on first boot
- [ ] Demo storyboard: login as clinician → dual-coded search → add to problem list → show audit log entry → show patient-role consent gating → show `/docs` Swagger for technical judges
- [ ] README with architecture diagram + a requirement-to-endpoint traceability table
- [ ] Backup screen recording in case live demo/network fails

**Prompt:**
```
Finalize the project for demo/submission.

1. Update docker-compose.yml to include api, postgres, and frontend services, plus a seed step (init container or npm script run on api startup) that runs prisma migrate deploy, then the NAMASTE ingestion (Phase 1), ICD-11 sync using a small cached sample of TM2/Biomedicine JSON checked into /data (so it doesn't require live WHO API access during the demo), and mapping seed (Phase 3) — idempotent, safe to rerun.
2. Add a top-level README.md with: one-paragraph problem summary, architecture diagram (mermaid), setup instructions (docker-compose up — that's it), and a table mapping each problem-statement requirement (FHIR CodeSystem, autocomplete, $translate, Bundle upload with dual coding, OAuth2/JWT auth, ISO 22600 RBAC, audit trail, versioning) to the exact endpoint/file implementing it.
3. Write DEMO_SCRIPT.md with numbered steps and exact example inputs (search terms, ABHA IDs) for a 3-minute live walkthrough: login as clinician, dual-code search, problem list write, audit log proof, patient-role consent gating, Swagger docs tour.
4. Add POST /admin/demo-reset (ADMIN role only) that truncates demo data and re-seeds, so the environment resets between practice runs without a full rebuild.
5. Run through DEMO_SCRIPT.md end-to-end against a fresh docker-compose up and fix anything that breaks.
```

---

## 5. Priority ordering, summarized

```
0. Setup            ─┐
1. NAMASTE ingest    │  BACKEND CORE / DATA
2. ICD-11 sync       │  (do not skip or rush — everything depends on this)
3. ConceptMap       ─┘
4. Terminology ops  ─┐
5. Auth/RBAC/Audit   │  BACKEND FUNCTIONALITY
6. Bundle/ProblemList│  (this is where the marks are)
7. Compliance pass  ─┘
8. Frontend (Next.js) ← last, keep it thin
9. Integration/demo   ← final polish
```

If you're short on time before submission, cut in this order: Phase 8 (thinner, not skipped — judges want to *see* something), then Phase 7's load-check sub-item, then Phase 3's optional similarity-suggester stretch goal. Never cut Phases 1, 4, 5, or 6 — those are the explicit deliverables named in the problem statement.
