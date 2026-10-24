# Compliance Notes

## FHIR R4 Approach

Resources are built as plain FHIR R4-shaped JSON and validated with focused Zod schemas for the fields this service relies on. This is intentionally lighter than a full HL7 FHIR validator for hackathon speed.

Covered generated resources:

- `CodeSystem`
- `ConceptMap`
- `ValueSet`
- `Parameters`
- `Bundle` transaction-response and searchset shapes in tests
- `OperationOutcome` error responses

FHIR samples can be dumped with:

```bash
node src/scripts/dumpFhirSamples.js
```

The dump script writes request payloads and response/resource examples into separate folders:

| File | Type | Intended use |
|---|---|---|
| `tmp/fhir_samples/requests/bundle-transaction-valid-request.json` | Request payload | POST to `/fhir/Bundle`; includes NAMASTE and TM2 codings. |
| `tmp/fhir_samples/requests/bundle-transaction-namaste-only-request.json` | Request payload | POST to `/fhir/Bundle`; includes only NAMASTE `NAM001`, expects automatic TM2 `TM2-001` persistence. |
| `tmp/fhir_samples/requests/bundle-transaction-missing-consent-invalid-request.json` | Request payload | Negative POST to `/fhir/Bundle`; expected HTTP 400 because Consent is missing. |
| `tmp/fhir_samples/responses/codesystem-namaste-response.json` | Response/resource example | Example output for `GET /fhir/CodeSystem/namaste`; not a Bundle request body. |
| `tmp/fhir_samples/responses/codesystem-icd11-tm2-response.json` | Response/resource example | Example output for `GET /fhir/CodeSystem/icd11-tm2`; not a Bundle request body. |
| `tmp/fhir_samples/responses/codesystem-icd11-biomedicine-response.json` | Response/resource example | Example output for `GET /fhir/CodeSystem/icd11-biomedicine`; not a Bundle request body. |
| `tmp/fhir_samples/responses/conceptmap-namaste-to-tm2-response.json` | Response/resource example | Example output for `GET /fhir/ConceptMap/namaste-to-tm2`; not a Bundle request body. |

The source-controlled request fixtures live under `data/fhir-request-samples/`. The Swagger `POST /fhir/Bundle` request example uses the same NAMASTE-only payload as `data/fhir-request-samples/bundle-transaction-namaste-only-request.json`.

Optional external validation:

```bash
java -jar validator_cli.jar tmp/fhir_samples/responses/codesystem-namaste-response.json -version 4.0
```

## Terminology Namespaces

The app uses explicit system URIs:

- NAMASTE: `https://namaste.ayush.gov.in/fhir/CodeSystem/namaste`
- ICD-11 TM2: `https://id.who.int/icd/release/11/tm2`
- ICD-11 MMS/Biomedicine: `https://id.who.int/icd/release/11/mms`
- HL7 condition clinical status: `http://terminology.hl7.org/CodeSystem/condition-clinical`

SNOMED CT and LOINC are not currently emitted. If added later, use `http://snomed.info/sct` and `http://loinc.org`.

## RBAC / ISO 22600 Intent

Roles are documented in `src/lib/rbac.js`:

- `CLINICIAN`: terminology read and Problem List write
- `PATIENT`: own Problem List read
- `ADMIN`: administrative sync, user/role management, mappings management, and full platform operations

## Audit Trail

`AuditLog` records `/fhir/*` access with actor, role, action, resource type, outcome, and consent status where available.

## Known Gaps

- JWT is an HS256 demo token, not real ABHA OAuth2 RS256/JWKS validation.
- WHO live sync requires real WHO ICD API credentials.
- In-memory cache is demo-grade and should move to Redis or another shared cache for multi-instance production.
- Current mapping CSV has 5 demo mappings; final content should be expanded and clinically reviewed.
