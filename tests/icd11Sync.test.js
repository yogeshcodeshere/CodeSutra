const request = require("supertest");

const { createApp } = require("../src/app");
const { prisma } = require("../src/lib/prisma");
const { getFirstSearchResultUri, getUriFromCodeInfo, summarizeSync, syncIcd11 } = require("../src/services/icd11Sync");
const { fhirCodeSystemSchema } = require("../src/schemas/fhirCodeSystem.schema");
const { authHeader } = require("./helpers/auth");

describe("ICD-11 sample sync and CodeSystems", () => {
  beforeEach(async () => {
    await prisma.icd11Concept.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("syncs sample ICD-11 concepts and exposes TM2 and biomedicine CodeSystems", async () => {
    const summary = await syncIcd11({ source: "sample" });

    expect(summary.status).toBe("ok");
    expect(summary.processed).toBe(6);
    expect(summary.failures).toHaveLength(0);

    const app = createApp();
    const tm2Response = await request(app)
      .get("/fhir/CodeSystem/icd11-tm2")
      .set("Authorization", authHeader())
      .expect(200);
    const biomedicineResponse = await request(app)
      .get("/fhir/CodeSystem/icd11-biomedicine")
      .set("Authorization", authHeader())
      .expect(200);

    expect(fhirCodeSystemSchema.safeParse(tm2Response.body).success).toBe(true);
    expect(fhirCodeSystemSchema.safeParse(biomedicineResponse.body).success).toBe(true);
    expect(tm2Response.body.concept).toHaveLength(4);
    expect(biomedicineResponse.body.concept).toHaveLength(2);
  });

  it("reports live sync status based on processed and failures", () => {
    expect(summarizeSync("live", 2, [])).toMatchObject({ status: "ok" });
    expect(summarizeSync("live", 2, [{ reason: "one failed" }])).toMatchObject({ status: "partial" });
    expect(summarizeSync("live", 0, [{ reason: "all failed" }])).toMatchObject({ status: "failed" });
  });

  it("extracts discovered URIs from WHO codeinfo and search responses", () => {
    expect(getUriFromCodeInfo({ linearizationUri: "https://id.who.int/icd/release/11/2026-01/mms/123" })).toContain(
      "/123"
    );
    expect(
      getFirstSearchResultUri({
        destinationEntities: [{ id: "https://id.who.int/icd/release/11/2026-01/mms/456" }]
      })
    ).toContain("/456");
  });
});
