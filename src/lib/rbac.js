const ROLES = {
  CLINICIAN: "CLINICIAN",
  PATIENT: "PATIENT",
  ADMIN: "ADMIN"
};

const PERMISSIONS = {
  [ROLES.CLINICIAN]: [
    "terminology:read",
    "problem-list:read:facility",
    "problem-list:write:facility"
  ],
  [ROLES.PATIENT]: ["problem-list:read:self"],
  [ROLES.ADMIN]: ["*"]
};

module.exports = { PERMISSIONS, ROLES };
