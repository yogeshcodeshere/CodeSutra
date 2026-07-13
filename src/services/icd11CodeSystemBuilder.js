const { prisma } = require("../lib/prisma");
const { fhirCodeSystemSchema } = require("../schemas/fhirCodeSystem.schema");

const ICD11_TM2_SYSTEM_URL = "https://id.who.int/icd/release/11/tm2";
const ICD11_BIOMEDICINE_SYSTEM_URL = "https://id.who.int/icd/release/11/mms";

function systemUrlForChapter(chapter) {
  return chapter === "tm2" ? ICD11_TM2_SYSTEM_URL : ICD11_BIOMEDICINE_SYSTEM_URL;
}

async function buildIcd11CodeSystem(chapter) {
  const concepts = await prisma.icd11Concept.findMany({
    where: { chapter },
    orderBy: { code: "asc" }
  });

  const codeSystem = {
    resourceType: "CodeSystem",
    url: systemUrlForChapter(chapter),
    version: "2026-demo",
    status: "active",
    content: "complete",
    concept: concepts.map((concept) => ({
      code: concept.code,
      display: concept.title,
      ...(concept.definition ? { definition: concept.definition } : {}),
      property: [
        {
          code: "entityId",
          valueString: concept.entityId
        },
        {
          code: "uri",
          valueString: concept.uri
        }
      ]
    }))
  };

  const parsed = fhirCodeSystemSchema.safeParse(codeSystem);

  if (!parsed.success) {
    throw new Error(`Generated ICD-11 ${chapter} CodeSystem failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

module.exports = {
  ICD11_BIOMEDICINE_SYSTEM_URL,
  ICD11_TM2_SYSTEM_URL,
  buildIcd11CodeSystem,
  systemUrlForChapter
};
