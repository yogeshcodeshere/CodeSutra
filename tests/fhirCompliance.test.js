const request = require("supertest");

const { createApp } = require("../src/app");
const { ROLES } = require("../src/lib/rbac");
const { NAMASTE_SYSTEM_URL } = require("../src/services/codeSystemBuilder");
const { prisma } = require("../src/lib/prisma");
const { ingestNamasteCsv } = require("../src/scripts/ingestNamaste");
const { seedMappings } = require("../src/scripts/seedMappings");
const { syncIcd11 } = require("../src/services/icd11Sync");
const { fhirCodeSystemSchema } = require("../src/schemas/fhirCodeSystem.schema");
const { fhirConceptMapSchema } = require("../src/schemas/fhirConceptMap.schema");
const { authHeader } = require("./helpers/auth");

function bundle() {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      {
        resource: {
          resourceType: "Condition",
          subject: { reference: "Patient/compliance-patient" },
          code: {
            coding: [{ system: NAMASTE_SYSTEM_URL, code: "NAM001" }]
          }
        }
      },
      {
        resource: {
          resourceType: "Consent",
          id: "compliance-consent",
          status: "active"
        }
      }
    ]
  };
}

describe("FHIR compliance smoke tests", () => {
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

  it("validates generated terminology FHIR resources", async () => {
    const app = createApp();
    const headers = { Authorization: authHeader(ROLES.CLINICIAN) };
    const namaste = await request(app).get("/fhir/CodeSystem/namaste").set(headers).expect(200);
    const tm2 = await request(app).get("/fhir/CodeSystem/icd11-tm2").set(headers).expect(200);
    const biomedicine = await request(app).get("/fhir/CodeSystem/icd11-biomedicine").set(headers).expect(200);
    const conceptMap = await request(app).get("/fhir/ConceptMap/namaste-to-tm2").set(headers).expect(200);

    expect(fhirCodeSystemSchema.safeParse(namaste.body).success).toBe(true);
    expect(fhirCodeSystemSchema.safeParse(tm2.body).success).toBe(true);
    expect(fhirCodeSystemSchema.safeParse(biomedicine.body).success).toBe(true);
    expect(fhirConceptMapSchema.safeParse(conceptMap.body).success).toBe(true);
  });

  it("validates Bundle write response shape", async () => {
    const response = await request(createApp())
      .post("/fhir/Bundle")
      .set("Authorization", authHeader(ROLES.CLINICIAN))
      .send(bundle())
      .expect(201);

    expect(response.body).toMatchObject({
      resourceType: "Bundle",
      type: "transaction-response"
    });
    expect(response.body.entry[0].response.status).toBe("201 Created");
  });
});
