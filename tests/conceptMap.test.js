const request = require("supertest");

const { createApp } = require("../src/app");
const { prisma } = require("../src/lib/prisma");
const { ingestNamasteCsv } = require("../src/scripts/ingestNamaste");
const { seedMappings } = require("../src/scripts/seedMappings");
const { fhirConceptMapSchema } = require("../src/schemas/fhirConceptMap.schema");
const { syncIcd11 } = require("../src/services/icd11Sync");
const { authHeader } = require("./helpers/auth");

describe("NAMASTE to TM2 ConceptMap", () => {
  beforeEach(async () => {
    await prisma.namasteTm2Mapping.deleteMany();
    await prisma.icd11Concept.deleteMany();
    await prisma.namasteConcept.deleteMany();
    await ingestNamasteCsv("data/sample-namaste.csv");
    await syncIcd11({ source: "sample" });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("seeds mappings and exposes a valid FHIR ConceptMap", async () => {
    const summary = await seedMappings("data/sample-mappings.csv");

    expect(summary.added).toBe(5);
    expect(summary.skipped).toBe(0);

    const response = await request(createApp())
      .get("/fhir/ConceptMap/namaste-to-tm2")
      .set("Authorization", authHeader())
      .expect(200);
    const parsed = fhirConceptMapSchema.safeParse(response.body);
    const equivalences = response.body.group[0].element.flatMap((element) =>
      element.target.map((target) => target.equivalence)
    );

    expect(parsed.success).toBe(true);
    expect(response.body.group[0].element).toHaveLength(5);
    expect(equivalences).toEqual(expect.arrayContaining(["relatedto", "wider"]));
  });
});
