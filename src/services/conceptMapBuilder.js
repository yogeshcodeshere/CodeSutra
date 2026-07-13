const { NAMASTE_SYSTEM_URL } = require("./codeSystemBuilder");
const { ICD11_TM2_SYSTEM_URL } = require("./icd11CodeSystemBuilder");
const { fhirConceptMapSchema } = require("../schemas/fhirConceptMap.schema");
const { prisma } = require("../lib/prisma");

async function buildNamasteToTm2ConceptMap() {
  const mappings = await prisma.namasteTm2Mapping.findMany({
    orderBy: [{ namasteCode: "asc" }, { tm2Code: "asc" }]
  });

  const namasteCodes = [...new Set(mappings.map((mapping) => mapping.namasteCode))];
  const tm2Codes = [...new Set(mappings.map((mapping) => mapping.tm2Code))];

  const [namasteConcepts, tm2Concepts] = await Promise.all([
    prisma.namasteConcept.findMany({ where: { code: { in: namasteCodes } } }),
    prisma.icd11Concept.findMany({ where: { code: { in: tm2Codes }, chapter: "tm2" } })
  ]);

  const namasteByCode = new Map(namasteConcepts.map((concept) => [concept.code, concept]));
  const tm2ByCode = new Map(tm2Concepts.map((concept) => [concept.code, concept]));
  const elementsByNamasteCode = new Map();

  for (const mapping of mappings) {
    const sourceConcept = namasteByCode.get(mapping.namasteCode);
    const targetConcept = tm2ByCode.get(mapping.tm2Code);
    const existing = elementsByNamasteCode.get(mapping.namasteCode) || {
      code: mapping.namasteCode,
      ...(sourceConcept?.display ? { display: sourceConcept.display } : {}),
      target: []
    };

    existing.target.push({
      code: mapping.tm2Code,
      ...(targetConcept?.title ? { display: targetConcept.title } : {}),
      equivalence: mapping.equivalence,
      ...(mapping.notes ? { comment: mapping.notes } : {})
    });

    elementsByNamasteCode.set(mapping.namasteCode, existing);
  }

  const conceptMap = {
    resourceType: "ConceptMap",
    url: "https://namaste.ayush.gov.in/fhir/ConceptMap/namaste-to-tm2",
    status: "active",
    sourceUri: NAMASTE_SYSTEM_URL,
    targetUri: ICD11_TM2_SYSTEM_URL,
    group: [
      {
        source: NAMASTE_SYSTEM_URL,
        target: ICD11_TM2_SYSTEM_URL,
        element: [...elementsByNamasteCode.values()]
      }
    ]
  };

  const parsed = fhirConceptMapSchema.safeParse(conceptMap);

  if (!parsed.success) {
    throw new Error(`Generated ConceptMap failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

module.exports = { buildNamasteToTm2ConceptMap };
