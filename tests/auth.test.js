const request = require("supertest");

const { createApp } = require("../src/app");
const { ROLES } = require("../src/lib/rbac");
const { prisma } = require("../src/lib/prisma");
const { ingestNamasteCsv } = require("../src/scripts/ingestNamaste");
const { authHeader } = require("./helpers/auth");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("auth, RBAC, and audit logging", () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.namasteConcept.deleteMany();
    await ingestNamasteCsv("data/sample-namaste.csv");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("issues demo JWTs from /auth/mock-token", async () => {
    const response = await request(createApp())
      .post("/auth/mock-token")
      .send({ abhaId: "abha-demo", role: ROLES.CLINICIAN, facilityId: "facility-demo" })
      .expect(200);

    expect(response.body.tokenType).toBe("Bearer");
    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects unauthenticated FHIR requests with 401", async () => {
    const response = await request(createApp()).get("/fhir/CodeSystem/namaste").expect(401);

    expect(response.body.resourceType).toBe("OperationOutcome");
  });

  it("rejects arbitrary bearer tokens with 401", async () => {
    const response = await request(createApp())
      .get("/fhir/CodeSystem/namaste")
      .set("Authorization", "Bearer not-a-valid-jwt")
      .expect(401);

    expect(response.body.resourceType).toBe("OperationOutcome");
  });

  it("accepts a /auth/mock-token accessToken when manually attached as Bearer", async () => {
    const app = createApp();
    const tokenResponse = await request(app)
      .post("/auth/mock-token")
      .send({ abhaId: "manual-token-abha", role: ROLES.CLINICIAN, facilityId: "facility-demo" })
      .expect(200);

    await request(app)
      .get("/fhir/CodeSystem/namaste")
      .set("Authorization", `Bearer ${tokenResponse.body.accessToken}`)
      .expect(200);
  });

  it("rejects non-admin users from admin sync with 403", async () => {
    await request(createApp())
      .post("/admin/sync/icd11?source=sample")
      .set("Authorization", authHeader(ROLES.PATIENT))
      .expect(403);
  });

  it("allows authenticated terminology reads and writes an AuditLog row", async () => {
    await request(createApp())
      .get("/fhir/CodeSystem/namaste")
      .set("Authorization", authHeader(ROLES.CLINICIAN, { abhaId: "audit-abha" }))
      .expect(200);

    await wait(50);

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        actorAbhaId: "audit-abha",
        action: "GET",
        resourceType: "CodeSystem"
      }
    });

    expect(auditLog).not.toBeNull();
    expect(auditLog.outcome).toBe("200");
  });
});
