const ROLES = {
  CLINICIAN: "CLINICIAN",
  CODER: "CODER",
  PATIENT: "PATIENT",
  ADMIN: "ADMIN"
};

const PERMISSIONS = {
  [ROLES.CLINICIAN]: [
    "terminology:read",
    "problem-list:read:facility",
    "problem-list:write:facility"
  ],
  [ROLES.CODER]: ["terminology:read", "problem-list:read"],
  [ROLES.PATIENT]: ["problem-list:read:self"],
  [ROLES.ADMIN]: ["*"]
};

module.exports = { PERMISSIONS, ROLES };
