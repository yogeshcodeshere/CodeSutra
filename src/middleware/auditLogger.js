const { logAccess, resourceTypeFromPath } = require("../services/audit");

function auditLogger(req, res, next) {
  res.on("finish", () => {
    if (!req.originalUrl.startsWith("/fhir/")) {
      return;
    }

    logAccess({
      actorAbhaId: req.user?.abhaId,
      role: req.user?.role,
      action: req.method,
      resourceType: resourceTypeFromPath(req.originalUrl.split("?")[0]),
      resourceId: req.params?.id || req.query?.code || null,
      outcome: res.statusCode,
      consentStatus: res.locals?.consentStatus
    }).catch((error) => {
      if (process.env.NODE_ENV !== "test") {
        console.error("Audit log write failed:", error.message);
      }
    });
  });

  next();
}

module.exports = { auditLogger };
