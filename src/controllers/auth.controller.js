const { z } = require("zod");

const { ROLES } = require("../lib/rbac");
const { signToken } = require("../lib/jwt");

const mockTokenSchema = z.object({
  body: z.object({
    abhaId: z.string().min(1),
    role: z.enum(Object.values(ROLES)),
    facilityId: z.string().min(1)
  }),
  query: z.any(),
  params: z.any()
});

function issueMockToken(req, res) {
  const { abhaId, role, facilityId } = req.validated.body;

  // DEMO ONLY: prototype token issuer for hackathon/dev use. Real ABHA OAuth2 replaces this route.
  const token = signToken({
    sub: abhaId,
    role,
    facilityId
  });

  res.json({
    tokenType: "Bearer",
    accessToken: token,
    expiresIn: process.env.JWT_EXPIRY
  });
}

module.exports = { issueMockToken, mockTokenSchema };
