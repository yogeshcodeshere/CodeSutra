const express = require("express");

const { issueMockToken, mockTokenSchema } = require("../controllers/auth.controller");
const { validateRequest } = require("../middleware/validate");

const router = express.Router();

/**
 * @openapi
 * /auth/mock-token:
 *   post:
 *     summary: Issue a demo-only JWT access token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [abhaId, role, facilityId]
 *             properties:
 *               abhaId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CLINICIAN, PATIENT, ADMIN]
 *               facilityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Demo access token
 */
router.post("/mock-token", validateRequest(mockTokenSchema), issueMockToken);

module.exports = router;
