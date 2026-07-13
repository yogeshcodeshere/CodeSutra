const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

function signToken(payload, expiresIn = env.JWT_EXPIRY) {
  return jwt.sign(payload, env.JWT_SECRET, { algorithm: "HS256", expiresIn });
}

function verifyToken(token) {
  // Prototype only: this HS256 JWT stands in for ABHA OAuth2 access tokens.
  // Production should verify RS256 tokens against ABHA's JWKS endpoint here.
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
}

module.exports = { signToken, verifyToken };
