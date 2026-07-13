const request = require("supertest");

const { createApp } = require("../src/app");
const { swaggerSpec } = require("../src/config/swagger");
const namasteOnlyBundle = require("../data/fhir-request-samples/bundle-transaction-namaste-only-request.json");

describe("Swagger/OpenAPI documentation", () => {
  it("defines an HTTP JWT bearer security scheme", () => {
    expect(swaggerSpec.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    });
  });

  it("applies bearerAuth to protected operations and not public operations", () => {
    expect(swaggerSpec.paths["/fhir/Bundle"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(swaggerSpec.paths["/fhir/CodeSystem/namaste"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(swaggerSpec.paths["/admin/sync/icd11"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(swaggerSpec.paths["/auth/mock-token"].post.security).toBeUndefined();
    expect(swaggerSpec.paths["/health"].get.security).toBeUndefined();
  });

  it("documents POST /fhir/Bundle with an executable application/json request body example", () => {
    const requestBody = swaggerSpec.paths["/fhir/Bundle"].post.requestBody;

    expect(requestBody.required).toBe(true);
    expect(requestBody.content["application/json"].examples.namasteOnlyBundle.value).toEqual(namasteOnlyBundle);
  });

  it("serves the same spec through /docs.json for manual request inspection", async () => {
    const response = await request(createApp()).get("/docs.json").expect(200);

    expect(response.body.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    });
    expect(response.body.paths["/fhir/Bundle"].post.security).toEqual([{ bearerAuth: [] }]);
  });
});
