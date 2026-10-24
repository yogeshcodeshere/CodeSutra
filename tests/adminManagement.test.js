const request = require("supertest");

const { createApp } = require("../src/app");
const { ROLES } = require("../src/lib/rbac");
const { prisma } = require("../src/lib/prisma");
const { authHeader } = require("./helpers/auth");

describe("Admin User and Mapping Management", () => {
  beforeEach(async () => {
    // Ensure clean state
    await prisma.user.deleteMany({ where: { abhaId: "test-doctor-001" } });
    await prisma.namasteTm2Mapping.deleteMany({ where: { namasteCode: "NAM-TEST-01" } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("denies access to non-admins", async () => {
    const app = createApp();

    await request(app)
      .get("/admin/users")
      .set("Authorization", authHeader(ROLES.CLINICIAN))
      .expect(403);

    await request(app)
      .get("/admin/mappings")
      .set("Authorization", authHeader(ROLES.PATIENT))
      .expect(403);
  });

  it("allows admin to list and create users", async () => {
    const app = createApp();

    const createRes = await request(app)
      .post("/admin/users")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .send({
        abhaId: "test-doctor-001",
        name: "Dr. Test Doctor",
        role: ROLES.CLINICIAN,
        facilityId: "facility-001",
        specialty: "Ayurvedic Surgery"
      })
      .expect(201);

    expect(createRes.body.abhaId).toBe("test-doctor-001");
    expect(createRes.body.role).toBe(ROLES.CLINICIAN);

    const listRes = await request(app)
      .get("/admin/users?query=Test Doctor")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);

    expect(listRes.body.users.some((u) => u.abhaId === "test-doctor-001")).toBe(true);

    // Update role
    const updateRes = await request(app)
      .put("/admin/users/test-doctor-001")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .send({ role: ROLES.PATIENT })
      .expect(200);

    expect(updateRes.body.role).toBe(ROLES.PATIENT);

    // Delete user
    await request(app)
      .delete("/admin/users/test-doctor-001")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);
  });

  it("allows admin to list and create mappings", async () => {
    const app = createApp();

    const createRes = await request(app)
      .post("/admin/mappings")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .send({
        namasteCode: "NAM-TEST-01",
        tm2Code: "TM2-TEST-01",
        equivalence: "equivalent",
        notes: "Test mapping for clinical review",
        confidence: 0.95,
        namasteDisplay: "Test Term",
        tm2Title: "Test TM2 Concept"
      })
      .expect(201);

    expect(createRes.body.namasteCode).toBe("NAM-TEST-01");
    expect(createRes.body.tm2Code).toBe("TM2-TEST-01");

    const listRes = await request(app)
      .get("/admin/mappings?filter=NAM-TEST-01")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);

    expect(listRes.body.mappings.length).toBeGreaterThan(0);
    const createdId = createRes.body.id;

    // Delete mapping
    await request(app)
      .delete(`/admin/mappings/${createdId}`)
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);
  });
});
