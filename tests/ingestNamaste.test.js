const request = require("supertest");

const { createApp } = require("../src/app");
const { prisma } = require("../src/lib/prisma");
const { ingestNamasteCsv } = require("../src/scripts/ingestNamaste");
const { fhirCodeSystemSchema } = require("../src/schemas/fhirCodeSystem.schema");
const { authHeader } = require("./helpers/auth");

describe("NAMASTE ingestion and CodeSystem", () => {
  beforeEach(async () => {
    await prisma.namasteConcept.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("ingests sample CSV and exposes a valid FHIR CodeSystem", async () => {
    const summary = await ingestNamasteCsv("data/sample-namaste.csv");

    expect(summary.added).toBe(5);
    expect(summary.skipped).toBe(0);

    const response = await request(createApp())
      .get("/fhir/CodeSystem/namaste")
      .set("Authorization", authHeader())
      .expect(200);
    const parsed = fhirCodeSystemSchema.safeParse(response.body);

    expect(parsed.success).toBe(true);
    expect(response.body.concept).toHaveLength(5);
  });
});
