const express = require("express");

const { getNamasteToTm2ConceptMap } = require("../controllers/conceptMap.controller");
const { translateCodeHandler } = require("../controllers/terminology.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validate");
const { ROLES } = require("../lib/rbac");
const { translateRequestSchema } = require("../schemas/fhirOperations.schema");

const router = express.Router();

/**
 * @openapi
 * /fhir/ConceptMap/$translate:
 *   post:
 *     summary: Translate NAMASTE codes to ICD-11 TM2 codes, or reverse
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [system, code]
 *             properties:
 *               system:
 *                 type: string
 *               code:
 *                 type: string
 *               targetSystem:
 *                 type: string
 *     responses:
 *       200:
 *         description: FHIR Parameters with translation result
 */
router.post(
  /^\/\$translate$/,
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.PATIENT, ROLES.ADMIN),
  validateRequest(translateRequestSchema),
  translateCodeHandler
);

/**
 * @openapi
 * /fhir/ConceptMap/namaste-to-tm2:
 *   get:
 *     summary: Return the NAMASTE to ICD-11 TM2 ConceptMap
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: FHIR R4 ConceptMap linking NAMASTE concepts to ICD-11 TM2 concepts
 */
router.get(
  "/namaste-to-tm2",
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.PATIENT, ROLES.ADMIN),
  getNamasteToTm2ConceptMap
);

module.exports = router;
