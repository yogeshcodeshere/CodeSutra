const { cache } = require("../lib/cache");
const { prisma } = require("../lib/prisma");
const { NAMASTE_SYSTEM_URL } = require("./codeSystemBuilder");
const {
  ICD11_BIOMEDICINE_SYSTEM_URL,
  ICD11_TM2_SYSTEM_URL
} = require("./icd11CodeSystemBuilder");
const { fhirParametersSchema, fhirValueSetSchema } = require("../schemas/fhirOperations.schema");

const AUTOCOMPLETE_TTL_MS = 60 * 1000;

function operationOutcome(statusCode, code, diagnostics, severity = "error") {
  return {
    statusCode,
    body: {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity,
          code,
          diagnostics
        }
      ]
    }
  };
}

function validateValueSet(valueSet) {
  const parsed = fhirValueSetSchema.safeParse(valueSet);

  if (!parsed.success) {
    throw new Error(`Generated ValueSet failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

function validateParameters(parameters) {
  const parsed = fhirParametersSchema.safeParse(parameters);

  if (!parsed.success) {
    throw new Error(`Generated Parameters failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

async function expandValueSet(filter, count = 20) {
  const normalizedFilter = filter.trim();
  const cacheKey = `expand:${normalizedFilter.toLowerCase()}:${count}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const [namasteConcepts, icd11Concepts] = await Promise.all([
    prisma.namasteConcept.findMany({
      where: {
        OR: [
          { display: { contains: normalizedFilter, mode: "insensitive" } },
          { definition: { contains: normalizedFilter, mode: "insensitive" } },
          { nativeTerm: { contains: normalizedFilter, mode: "insensitive" } }
        ]
      },
      take: count,
      orderBy: { code: "asc" }
    }),
    prisma.icd11Concept.findMany({
      where: {
        OR: [
          { title: { contains: normalizedFilter, mode: "insensitive" } },
          { definition: { contains: normalizedFilter, mode: "insensitive" } }
        ]
      },
      take: count,
      orderBy: [{ chapter: "asc" }, { code: "asc" }]
    })
  ]);

  const contains = [
    ...namasteConcepts.map((concept) => ({
      system: NAMASTE_SYSTEM_URL,
      code: concept.code,
      display: concept.display
    })),
    ...icd11Concepts.map((concept) => ({
      system: concept.chapter === "tm2" ? ICD11_TM2_SYSTEM_URL : ICD11_BIOMEDICINE_SYSTEM_URL,
      code: concept.code,
      display: concept.title
    }))
  ].slice(0, count);

  const valueSet = validateValueSet({
    resourceType: "ValueSet",
    expansion: {
      total: contains.length,
      contains
    }
  });

  cache.set(cacheKey, valueSet, AUTOCOMPLETE_TTL_MS);
  return valueSet;
}

async function lookupCode(system, code) {
  if (system === NAMASTE_SYSTEM_URL) {
    const concept = await prisma.namasteConcept.findUnique({ where: { code } });

    if (!concept) {
      return operationOutcome(404, "not-found", `Code ${code} was not found in NAMASTE.`);
    }

    return {
      statusCode: 200,
      body: validateParameters({
        resourceType: "Parameters",
        parameter: [
          { name: "display", valueString: concept.display },
          ...(concept.definition ? [{ name: "definition", valueString: concept.definition }] : []),
          { name: "category", valueString: concept.category },
          ...(concept.nativeTerm ? [{ name: "nativeTerm", valueString: concept.nativeTerm }] : [])
        ]
      })
    };
  }

  if (system === ICD11_TM2_SYSTEM_URL || system === ICD11_BIOMEDICINE_SYSTEM_URL) {
    const chapter = system === ICD11_TM2_SYSTEM_URL ? "tm2" : "biomedicine";
    const concept = await prisma.icd11Concept.findFirst({ where: { code, chapter } });

    if (!concept) {
      return operationOutcome(404, "not-found", `Code ${code} was not found in ${chapter}.`);
    }

    return {
      statusCode: 200,
      body: validateParameters({
        resourceType: "Parameters",
        parameter: [
          { name: "display", valueString: concept.title },
          ...(concept.definition ? [{ name: "definition", valueString: concept.definition }] : []),
          { name: "chapter", valueString: concept.chapter },
          { name: "uri", valueString: concept.uri }
        ]
      })
    };
  }

  return operationOutcome(400, "not-supported", `Unsupported code system: ${system}`);
}

async function translateCode({ system, code, targetSystem }) {
  if (system === NAMASTE_SYSTEM_URL) {
    const mapping = await prisma.namasteTm2Mapping.findFirst({
      where: { namasteCode: code },
      orderBy: { confidence: "desc" }
    });

    if (!mapping || (targetSystem && targetSystem !== ICD11_TM2_SYSTEM_URL)) {
      return unmatchedParameters(code);
    }

    const targetConcept = await prisma.icd11Concept.findFirst({
      where: { code: mapping.tm2Code, chapter: "tm2" }
    });

    return matchedParameters({
      equivalence: mapping.equivalence,
      system: ICD11_TM2_SYSTEM_URL,
      code: mapping.tm2Code,
      display: targetConcept?.title
    });
  }

  if (system === ICD11_TM2_SYSTEM_URL) {
    const mapping = await prisma.namasteTm2Mapping.findFirst({
      where: { tm2Code: code },
      orderBy: { confidence: "desc" }
    });

    if (!mapping || (targetSystem && targetSystem !== NAMASTE_SYSTEM_URL)) {
      return unmatchedParameters(code);
    }

    const targetConcept = await prisma.namasteConcept.findUnique({
      where: { code: mapping.namasteCode }
    });

    return matchedParameters({
      equivalence: mapping.equivalence,
      system: NAMASTE_SYSTEM_URL,
      code: mapping.namasteCode,
      display: targetConcept?.display
    });
  }

  return unmatchedParameters(code);
}

function matchedParameters({ equivalence, system, code, display }) {
  return validateParameters({
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      {
        name: "match",
        part: [
          { name: "equivalence", valueCode: equivalence },
          {
            name: "concept",
            valueCoding: {
              system,
              code,
              ...(display ? { display } : {})
            }
          }
        ]
      }
    ]
  });
}

function unmatchedParameters(code) {
  return validateParameters({
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: false },
      {
        name: "message",
        valueString: `No mapping found for ${code}.`
      }
    ]
  });
}

module.exports = {
  expandValueSet,
  lookupCode,
  operationOutcome,
  translateCode
};
