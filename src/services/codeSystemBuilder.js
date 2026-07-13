const { prisma } = require("../lib/prisma");
const { fhirCodeSystemSchema } = require("../schemas/fhirCodeSystem.schema");

const NAMASTE_SYSTEM_URL = "https://namaste.ayush.gov.in/fhir/CodeSystem/namaste";

async function buildNamasteCodeSystem() {
  const concepts = await prisma.namasteConcept.findMany({
    orderBy: { code: "asc" }
  });

  const version = concepts[0]?.version || "2026-demo";

  const codeSystem = {
    resourceType: "CodeSystem",
    url: NAMASTE_SYSTEM_URL,
    version,
    status: "active",
    content: "complete",
    concept: concepts.map((concept) => ({
      code: concept.code,
      display: concept.display,
      ...(concept.definition ? { definition: concept.definition } : {}),
      property: [
        {
          code: "category",
          valueString: concept.category
        },
        ...(concept.nativeTerm
          ? [
              {
                code: "nativeTerm",
                valueString: concept.nativeTerm
              }
            ]
          : [])
      ]
    }))
  };

  const parsed = fhirCodeSystemSchema.safeParse(codeSystem);

  if (!parsed.success) {
    throw new Error(`Generated NAMASTE CodeSystem failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

module.exports = { NAMASTE_SYSTEM_URL, buildNamasteCodeSystem };
