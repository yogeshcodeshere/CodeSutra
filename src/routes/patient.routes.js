const express = require("express");

const { readProblemListHandler } = require("../controllers/problemList.controller");
const { ROLES } = require("../lib/rbac");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validate");
const { problemListReadRequestSchema } = require("../schemas/fhirBundle.schema");

const router = express.Router();

/**
 * @openapi
 * /fhir/Patient/{abhaId}/ProblemList:
 *   get:
 *     summary: Read a patient's dual-coded Problem List
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: abhaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: FHIR Bundle of Condition resources
 */
router.get(
  "/:abhaId/ProblemList",
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.CODER, ROLES.PATIENT, ROLES.ADMIN),
  validateRequest(problemListReadRequestSchema),
  readProblemListHandler
);

module.exports = router;
