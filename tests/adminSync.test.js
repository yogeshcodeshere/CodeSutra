const request = require("supertest");

jest.mock("../src/services/icd11Sync", () => ({
  syncIcd11: jest.fn()
}));

const { createApp } = require("../src/app");
const { ROLES } = require("../src/lib/rbac");
const { syncIcd11 } = require("../src/services/icd11Sync");
const { authHeader } = require("./helpers/auth");

describe("POST /admin/sync/icd11 query validation", () => {
  beforeEach(() => {
    syncIcd11.mockReset();
    syncIcd11.mockImplementation(async ({ source }) => ({
      status: "ok",
      source,
      processed: source === "sample" ? 6 : 1,
      failures: []
    }));
  });

  it("accepts source=sample", async () => {
    const response = await request(createApp())
      .post("/admin/sync/icd11?source=sample")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);

    expect(response.body).toMatchObject({ status: "ok", source: "sample" });
    expect(syncIcd11).toHaveBeenCalledWith({ source: "sample" });
  });

  it("accepts source=live", async () => {
    const response = await request(createApp())
      .post("/admin/sync/icd11?source=live")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);

    expect(response.body).toMatchObject({ status: "ok", source: "live" });
    expect(syncIcd11).toHaveBeenCalledWith({ source: "live" });
  });

  it("defaults missing source to sample", async () => {
    const response = await request(createApp())
      .post("/admin/sync/icd11")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(200);

    expect(response.body).toMatchObject({ status: "ok", source: "sample" });
    expect(syncIcd11).toHaveBeenCalledWith({ source: "sample" });
  });

  it("rejects invalid explicit source values", async () => {
    const response = await request(createApp())
      .post("/admin/sync/icd11?source=dukkar")
      .set("Authorization", authHeader(ROLES.ADMIN))
      .expect(400);

    expect(response.body).toMatchObject({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "invalid",
          diagnostics: 'Invalid source query parameter. Expected "sample" or "live".'
        }
      ]
    });
    expect(syncIcd11).not.toHaveBeenCalled();
  });
});
