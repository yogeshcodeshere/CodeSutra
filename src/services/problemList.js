const { prisma } = require("../lib/prisma");
const { NAMASTE_SYSTEM_URL } = require("./codeSystemBuilder");
const {
  ICD11_BIOMEDICINE_SYSTEM_URL,
  ICD11_TM2_SYSTEM_URL
} = require("./icd11CodeSystemBuilder");
const { translateCode } = require("./terminologyOps");

function bundleOutcome(statusCode, code, diagnostics, severity = "error") {
  return {
    statusCode,
    body: {
      resourceType: "OperationOutcome",
      issue: [{ severity, code, diagnostics }]
    }
  };
}

function extractPatientAbhaId(reference) {
  const value = String(reference || "");
  return value.startsWith("Patient/") ? value.slice("Patient/".length) : value;
}

function getCodings(condition) {
  return condition.code?.coding || [];
}

function findConsentId(bundle) {
  const consentEntry = bundle.entry.find((entry) => entry.resource?.resourceType === "Consent");
  return consentEntry?.resource?.id || consentEntry?.fullUrl || null;
}

function clinicalStatusCode(condition) {
  return condition.clinicalStatus?.coding?.[0]?.code || "active";
}

async function tm2FromTranslate(namasteCode) {
  const translated = await translateCode({ system: NAMASTE_SYSTEM_URL, code: namasteCode });
  const match = translated.parameter.find((parameter) => parameter.name === "match");
  return match?.part?.find((part) => part.name === "concept")?.valueCoding?.code || null;
}

async function createProblemListFromBundle({ bundle, user }) {
  const consentId = findConsentId(bundle);

  if (!consentId) {
    return bundleOutcome(400, "required", "Bundle must include a Consent resource.");
  }

  const conditions = bundle.entry
    .map((entry) => entry.resource)
    .filter((resource) => resource?.resourceType === "Condition");

  if (conditions.length === 0) {
    return bundleOutcome(400, "required", "Bundle must include at least one Condition resource.");
  }

  const responseEntries = [];
  const warnings = [];

  for (const condition of conditions) {
    const patientAbhaId = extractPatientAbhaId(condition.subject?.reference);

    if (!patientAbhaId) {
      return bundleOutcome(400, "required", "Condition.subject.reference is required.");
    }

    const codings = getCodings(condition);
    const namasteCoding = codings.find((coding) => coding.system === NAMASTE_SYSTEM_URL);

    if (!namasteCoding) {
      return bundleOutcome(400, "required", "Condition.code.coding must include a NAMASTE coding.");
    }

    const namasteConcept = await prisma.namasteConcept.findUnique({
      where: { code: namasteCoding.code }
    });

    if (!namasteConcept) {
      return bundleOutcome(400, "not-found", `NAMASTE code ${namasteCoding.code} does not exist.`);
    }

    const tm2Coding = codings.find((coding) => coding.system === ICD11_TM2_SYSTEM_URL);
    const biomedicineCoding = codings.find((coding) => coding.system === ICD11_BIOMEDICINE_SYSTEM_URL);
    const tm2Code = tm2Coding?.code || (await tm2FromTranslate(namasteCoding.code));

    if (!tm2Code) {
      warnings.push(`No TM2 mapping found for ${namasteCoding.code}.`);
    }

    const previous = await prisma.problemListEntry.findFirst({
      where: {
        patientAbhaId,
        namasteCode: namasteCoding.code
      },
      orderBy: { version: "desc" }
    });

    const entry = await prisma.$transaction(async (tx) => {
      await tx.problemListEntry.updateMany({
        where: {
          patientAbhaId,
          namasteCode: namasteCoding.code,
          isCurrent: true
        },
        data: { isCurrent: false }
      });

      return tx.problemListEntry.create({
        data: {
          patientAbhaId,
          namasteCode: namasteCoding.code,
          tm2Code,
          biomedicineCode: biomedicineCoding?.code || null,
          displayText: condition.code?.text || namasteCoding.display || namasteConcept.display,
          clinicalStatus: clinicalStatusCode(condition),
          recordedByAbhaId: user.abhaId,
          recordedAt: new Date(),
          consentId,
          version: (previous?.version || 0) + 1,
          isCurrent: true
        }
      });
    });

    responseEntries.push({
      response: {
        status: "201 Created",
        location: `ProblemListEntry/${entry.id}`
      }
    });
  }

  return {
    statusCode: 201,
    consentId,
    body: {
      resourceType: "Bundle",
      type: "transaction-response",
      entry: responseEntries,
      ...(warnings.length
        ? {
            issue: warnings.map((diagnostics) => ({
              severity: "warning",
              code: "informational",
              diagnostics
            }))
          }
        : {})
    }
  };
}

async function readProblemList({ patientAbhaId, includeHistory = false }) {
  const entries = await prisma.problemListEntry.findMany({
    where: {
      patientAbhaId,
      ...(includeHistory ? {} : { isCurrent: true })
    },
    orderBy: [{ namasteCode: "asc" }, { version: "desc" }]
  });

  return {
    resourceType: "Bundle",
    type: "searchset",
    total: entries.length,
    entry: entries.map((entry) => ({
      resource: {
        resourceType: "Condition",
        id: String(entry.id),
        subject: { reference: `Patient/${entry.patientAbhaId}` },
        clinicalStatus: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: entry.clinicalStatus }]
        },
        code: {
          text: entry.displayText,
          coding: [
            { system: NAMASTE_SYSTEM_URL, code: entry.namasteCode },
            ...(entry.tm2Code ? [{ system: ICD11_TM2_SYSTEM_URL, code: entry.tm2Code }] : []),
            ...(entry.biomedicineCode ? [{ system: ICD11_BIOMEDICINE_SYSTEM_URL, code: entry.biomedicineCode }] : [])
          ]
        },
        recordedDate: entry.recordedAt.toISOString(),
        extension: [
          { url: "https://namaste.ayush.gov.in/fhir/StructureDefinition/recordedBy", valueString: entry.recordedByAbhaId },
          { url: "https://namaste.ayush.gov.in/fhir/StructureDefinition/consentId", valueString: entry.consentId },
          { url: "https://namaste.ayush.gov.in/fhir/StructureDefinition/version", valueInteger: entry.version },
          { url: "https://namaste.ayush.gov.in/fhir/StructureDefinition/isCurrent", valueBoolean: entry.isCurrent }
        ]
      }
    }))
  };
}

module.exports = { createProblemListFromBundle, readProblemList };
