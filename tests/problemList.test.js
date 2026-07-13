const request = require("supertest");

const { createApp } = require("../src/app");
const { ROLES } = require("../src/lib/rbac");
const { NAMASTE_SYSTEM_URL } = require("../src/services/codeSystemBuilder");
const { ICD11_TM2_SYSTEM_URL } = require("../src/services/icd11CodeSystemBuilder");
const { prisma } = require("../src/lib/prisma");
const { ingestNamasteCsv } = require("../src/scripts/ingestNamaste");
const { seedMappings } = require("../src/scripts/seedMappings");
const { syncIcd11 } = require("../src/services/icd11Sync");
const { authHeader } = require("./helpers/auth");
const swaggerBundleExample = require("../data/fhir-request-samples/bundle-transaction-namaste-only-request.json");

function clinicalBundle({ patientId = "patient-001", namasteCode = "NAM001", includeConsent = true }) {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      {
        resource: {
          resourceType: "Condition",
          subject: { reference: `Patient/${patientId}` },
          clinicalStatus: {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }]
          },
          code: {
            text: "Demo diagnosis",
            coding: [{ system: NAMASTE_SYSTEM_URL, code: namasteCode, display: "Jwara" }]
          }
        }
      },
      ...(includeConsent
        ? [
            {
              resource: {
                resourceType: "Consent",
                id: "consent-001",
                status: "active"
              }
            }
          ]
        : [])
    ]
  };
}

describe("Problem List clinical write path", () => {
  beforeEach(async () => {
    await prisma.problemListEntry.deleteMany();
    await prisma.namasteTm2Mapping.deleteMany();
    await prisma.icd11Concept.deleteMany();
    await prisma.namasteConcept.deleteMany();
    await ingestNamasteCsv("data/sample-namaste.csv");
    await syncIcd11({ source: "sample" });
    await seedMappings("data/sample-mappings.csv");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("auto-populates TM2 code when Bundle only includes NAMASTE coding", async () => {
    const response = await request(createApp())
      .post("/fhir/Bundle")
      .set("Authorization", authHeader(ROLES.CLINICIAN))
      .send(clinicalBundle({}))
      .expect(201);

    expect(response.body.resourceType).toBe("Bundle");

    const entry = await prisma.problemListEntry.findFirst({ where: { patientAbhaId: "patient-001" } });
    expect(entry.tm2Code).toBe("TM2-001");
  });

  it("rejects missing consent", async () => {
    const response = await request(createApp())
      .post("/fhir/Bundle")
      .set("Authorization", authHeader(ROLES.CLINICIAN))
      .send(clinicalBundle({ includeConsent: false }))
      .expect(400);

    expect(response.body.resourceType).toBe("OperationOutcome");
  });

  it("versions repeat submissions instead of overwriting", async () => {
    const app = createApp();
    await request(app).post("/fhir/Bundle").set("Authorization", authHeader(ROLES.CLINICIAN)).send(clinicalBundle({})).expect(201);
    await request(app).post("/fhir/Bundle").set("Authorization", authHeader(ROLES.CLINICIAN)).send(clinicalBundle({})).expect(201);

    const entries = await prisma.problemListEntry.findMany({
      where: { patientAbhaId: "patient-001", namasteCode: "NAM001" },
      orderBy: { version: "asc" }
    });

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.version)).toEqual([1, 2]);
    expect(entries.map((entry) => entry.isCurrent)).toEqual([false, true]);
  });

  it("lets a patient read only their own Problem List", async () => {
    const app = createApp();
    await request(app).post("/fhir/Bundle").set("Authorization", authHeader(ROLES.CLINICIAN)).send(clinicalBundle({})).expect(201);

    await request(app)
      .get("/fhir/Patient/patient-001/ProblemList")
      .set("Authorization", authHeader(ROLES.PATIENT, { abhaId: "someone-else" }))
      .expect(403);

    const ownResponse = await request(app)
      .get("/fhir/Patient/patient-001/ProblemList?includeHistory=true")
      .set("Authorization", authHeader(ROLES.PATIENT, { abhaId: "patient-001" }))
      .expect(200);

    expect(ownResponse.body.total).toBe(1);
    expect(ownResponse.body.entry[0].resource.code.coding).toEqual(
      expect.arrayContaining([expect.objectContaining({ system: ICD11_TM2_SYSTEM_URL, code: "TM2-001" })])
    );
  });

  it("accepts the documented Swagger Bundle example and persists dual coding", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/fhir/Bundle")
      .set("Authorization", authHeader(ROLES.CLINICIAN))
      .send(swaggerBundleExample)
      .expect(201);

    expect(response.body).toMatchObject({
      resourceType: "Bundle",
      type: "transaction-response"
    });

    const entry = await prisma.problemListEntry.findFirst({
      where: {
        patientAbhaId: "swagger-demo-patient",
        isCurrent: true
      }
    });

    expect(entry).toMatchObject({
      namasteCode: "NAM001",
      tm2Code: "TM2-001",
      isCurrent: true
    });

    const readBack = await request(app)
      .get("/fhir/Patient/swagger-demo-patient/ProblemList")
      .set("Authorization", authHeader(ROLES.CLINICIAN))
      .expect(200);

    const codings = readBack.body.entry[0].resource.code.coding;
    expect(codings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ system: NAMASTE_SYSTEM_URL, code: "NAM001" }),
        expect.objectContaining({ system: ICD11_TM2_SYSTEM_URL, code: "TM2-001" })
      ])
    );
  });
});
