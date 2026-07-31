const request = require("supertest");

const { createApp } = require("../src/app");

describe("protected route auth coverage", () => {
  const protectedRequests = [
    ["get", "/fhir/CodeSystem/namaste"],
    ["get", "/fhir/CodeSystem/icd11-tm2"],
    ["get", "/fhir/CodeSystem/icd11-biomedicine"],
    ["get", "/fhir/ConceptMap/namaste-to-tm2"],
    ["get", "/fhir/ValueSet/$expand?filter=fever"],
    ["get", "/fhir/CodeSystem/$lookup?system=https%3A%2F%2Fnamaste.ayush.gov.in%2Ffhir%2FCodeSystem%2Fnamaste&code=NAM001"],
    ["post", "/fhir/ConceptMap/$translate"],
    ["post", "/fhir/Bundle"],
    ["get", "/fhir/Patient/demo/ProblemList"],
    ["post", "/admin/sync/icd11?source=sample"],
    ["post", "/admin/demo-reset"]
  ];

  it.each(protectedRequests)("%s %s requires auth", async (method, path) => {
    const response = await request(createApp())[method](path).send({}).expect((res) => {
      expect([401, 403]).toContain(res.status);
    });

    expect(response.body.resourceType).toBe("OperationOutcome");
  });
});
