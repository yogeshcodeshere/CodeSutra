const { verifyToken } = require("../lib/jwt");

function authOutcome(statusCode, code, diagnostics) {
  return {
    statusCode,
    body: {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code,
          diagnostics
        }
      ]
    }
  };
}

function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    const outcome = authOutcome(401, "security", "Missing Bearer token.");
    return res.status(outcome.statusCode).json(outcome.body);
  }

  try {
    const decoded = verifyToken(match[1]);
    req.user = {
      abhaId: decoded.sub,
      role: decoded.role,
      facilityId: decoded.facilityId
    };
    return next();
  } catch (error) {
    const outcome = authOutcome(401, "security", "Invalid or expired Bearer token.");
    return res.status(outcome.statusCode).json(outcome.body);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const outcome = authOutcome(403, "forbidden", "User role is not permitted for this operation.");
      return res.status(outcome.statusCode).json(outcome.body);
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole };
