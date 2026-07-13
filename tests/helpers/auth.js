const { ROLES } = require("../../src/lib/rbac");
const { signToken } = require("../../src/lib/jwt");

function tokenFor(role = ROLES.CLINICIAN, overrides = {}) {
  return signToken({
    sub: overrides.abhaId || "test-abha-001",
    role,
    facilityId: overrides.facilityId || "facility-001"
  });
}

function authHeader(role = ROLES.CLINICIAN, overrides = {}) {
  return `Bearer ${tokenFor(role, overrides)}`;
}

module.exports = { authHeader, tokenFor };
