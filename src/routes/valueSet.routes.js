const express = require("express");

const { expandValueSetHandler } = require("../controllers/terminology.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validate");
const { ROLES } = require("../lib/rbac");
const { expandRequestSchema } = require("../schemas/fhirOperations.schema");

const router = express.Router();

/**
 * @openapi
 * /fhir/ValueSet/$expand:
 *   get:
 *     summary: Autocomplete terminology search across NAMASTE and ICD-11
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: FHIR ValueSet expansion
 */
router.get(
  /^\/\$expand$/,
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.CODER, ROLES.PATIENT, ROLES.ADMIN),
  validateRequest(expandRequestSchema),
  expandValueSetHandler
);

module.exports = router;
