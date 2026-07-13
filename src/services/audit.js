const { prisma } = require("../lib/prisma");

function resourceTypeFromPath(path) {
  const parts = path.split("/").filter(Boolean);
  return parts[0] === "fhir" ? parts[1] || null : parts[0] || null;
}

async function logAccess({
  actorAbhaId,
  role,
  action,
  resourceType,
  resourceId,
  outcome,
  consentStatus
}) {
  return prisma.auditLog.create({
    data: {
      actorAbhaId: actorAbhaId || null,
      role: role || null,
      action,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      outcome: String(outcome),
      consentStatus: consentStatus || null
    }
  });
}

module.exports = { logAccess, resourceTypeFromPath };
