# CodeSutra Demo Script

## Setup

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:3001`
- Swagger: `http://localhost:3000/docs`

## 3-Minute Walkthrough

1. In CodeSutra, keep role as `CLINICIAN`.
2. Click **Get Demo Token**.
3. Search for `fever`.
4. Show the NAMASTE result `NAM001 - Jwara` and its suggested TM2 mapping `TM2-001`.
5. Use patient ID `patient-demo-001`.
6. Click **Add to Problem List**.
7. Show the Problem List table with both NAMASTE and TM2 codings.
8. Toggle **Include history**, then add the same item again to demonstrate versioning.
9. Switch role to `PATIENT`, set ABHA ID to `someone-else`, get a token, and attempt to load `patient-demo-001` to show consent/self-read enforcement.
10. Open Swagger at `/docs`.
11. Use `/auth/mock-token` to create an `ADMIN` or `CLINICIAN` token.
12. Click **Authorize**, paste only the raw `accessToken`, and call protected FHIR endpoints.

## Swagger Bundle Test

Use the built-in example under:

`POST /fhir/Bundle`

The example submits only NAMASTE `NAM001`; the backend auto-populates TM2 `TM2-001`.

The same payload is stored at:

`data/fhir-request-samples/bundle-transaction-namaste-only-request.json`

## Reset Between Runs

In Swagger:

1. Get an `ADMIN` token from `/auth/mock-token`.
2. Authorize with that token.
3. Call `POST /admin/demo-reset`.
