const request = require("supertest");

const { createApp } = require("../src/app");
const { ROLES } = require("../src/lib/rbac");
const { prisma } = require("../src/lib/prisma");
const { authHeader } = require("./helpers/auth");

describe("POST /admin/demo-reset", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("requires ADMIN role", async () => {
    await request(createApp())
      .post("/admin/demo-reset")
      .set("Authorization", authHeader(ROLES.CLINICIAN))
      .expect(403);
  });

  it("resets and reseeds demo terminology data", async () => {
    const response = await request(createApp())
      .post("/admin/demo-reset")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);

    expect(response.body.status).toBe("ok");
    await expect(prisma.namasteConcept.count()).resolves.toBe(5);
    await expect(prisma.icd11Concept.count()).resolves.toBe(6);
    await expect(prisma.namasteTm2Mapping.count()).resolves.toBe(5);
  });
});
