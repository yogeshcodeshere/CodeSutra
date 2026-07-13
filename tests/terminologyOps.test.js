const request = require("supertest");

const { createApp } = require("../src/app");
const { NAMASTE_SYSTEM_URL } = require("../src/services/codeSystemBuilder");
const { ICD11_TM2_SYSTEM_URL } = require("../src/services/icd11CodeSystemBuilder");
const { prisma } = require("../src/lib/prisma");
const { ingestNamasteCsv } = require("../src/scripts/ingestNamaste");
const { seedMappings } = require("../src/scripts/seedMappings");
const { syncIcd11 } = require("../src/services/icd11Sync");
const { fhirParametersSchema, fhirValueSetSchema } = require("../src/schemas/fhirOperations.schema");
const { authHeader } = require("./helpers/auth");

describe("FHIR terminology operations", () => {
  beforeEach(async () => {
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

  it("expands autocomplete results across NAMASTE and ICD-11", async () => {
    const response = await request(createApp())
      .get("/fhir/ValueSet/$expand?filter=fever&count=10")
      .set("Authorization", authHeader())
      .expect(200);
    const systems = response.body.expansion.contains.map((entry) => entry.system);

    expect(fhirValueSetSchema.safeParse(response.body).success).toBe(true);
    expect(systems).toEqual(expect.arrayContaining([NAMASTE_SYSTEM_URL, ICD11_TM2_SYSTEM_URL]));
  });

  it("looks up NAMASTE code details", async () => {
    const response = await request(createApp())
      .get(`/fhir/CodeSystem/$lookup?system=${encodeURIComponent(NAMASTE_SYSTEM_URL)}&code=NAM001`)
      .set("Authorization", authHeader())
      .expect(200);

    expect(fhirParametersSchema.safeParse(response.body).success).toBe(true);
    expect(response.body.parameter).toEqual(expect.arrayContaining([{ name: "display", valueString: "Jwara" }]));
  });

  it("returns OperationOutcome when lookup code is not found", async () => {
    const response = await request(createApp())
      .get(`/fhir/CodeSystem/$lookup?system=${encodeURIComponent(NAMASTE_SYSTEM_URL)}&code=NOPE`)
      .set("Authorization", authHeader())
      .expect(404);

    expect(response.body.resourceType).toBe("OperationOutcome");
  });

  it("translates NAMASTE to TM2", async () => {
    const response = await request(createApp())
      .post("/fhir/ConceptMap/$translate")
      .set("Authorization", authHeader())
      .send({ system: NAMASTE_SYSTEM_URL, code: "NAM001" })
      .expect(200);

    expect(fhirParametersSchema.safeParse(response.body).success).toBe(true);
    expect(response.body.parameter[0]).toEqual({ name: "result", valueBoolean: true });
    expect(response.body.parameter[1].part[1].valueCoding).toMatchObject({
      system: ICD11_TM2_SYSTEM_URL,
      code: "TM2-001"
    });
  });

  it("translates TM2 to NAMASTE", async () => {
    const response = await request(createApp())
      .post("/fhir/ConceptMap/$translate")
      .set("Authorization", authHeader())
      .send({ system: ICD11_TM2_SYSTEM_URL, code: "TM2-003" })
      .expect(200);

    expect(response.body.parameter[0]).toEqual({ name: "result", valueBoolean: true });
    expect(response.body.parameter[1].part[1].valueCoding).toMatchObject({
      system: NAMASTE_SYSTEM_URL,
      code: "NAM003"
    });
  });

  it("returns result=false for unmapped translate requests", async () => {
    const response = await request(createApp())
      .post("/fhir/ConceptMap/$translate")
      .set("Authorization", authHeader())
      .send({ system: NAMASTE_SYSTEM_URL, code: "UNMAPPED" })
      .expect(200);

    expect(response.body.parameter[0]).toEqual({ name: "result", valueBoolean: false });
  });
});
