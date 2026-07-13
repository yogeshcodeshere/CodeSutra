const express = require("express");

const {
  getIcd11BiomedicineCodeSystem,
  getIcd11Tm2CodeSystem,
  getNamasteCodeSystem
} = require("../controllers/codeSystem.controller");
const { lookupCodeHandler } = require("../controllers/terminology.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validate");
const { ROLES } = require("../lib/rbac");
const { lookupRequestSchema } = require("../schemas/fhirOperations.schema");

const router = express.Router();

/**
 * @openapi
 * /fhir/CodeSystem/$lookup:
 *   get:
 *     summary: Look up details for a single terminology code
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: system
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FHIR Parameters with code details
 *       404:
 *         description: Code not found
 */
router.get(
  /^\/\$lookup$/,
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.CODER, ROLES.PATIENT, ROLES.ADMIN),
  validateRequest(lookupRequestSchema),
  lookupCodeHandler
);

/**
 * @openapi
 * /fhir/CodeSystem/namaste:
 *   get:
 *     summary: Return the NAMASTE FHIR CodeSystem
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: NAMASTE concepts as a FHIR R4 CodeSystem
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 */
router.get(
  "/namaste",
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.CODER, ROLES.PATIENT, ROLES.ADMIN),
  getNamasteCodeSystem
);

/**
 * @openapi
 * /fhir/CodeSystem/icd11-tm2:
 *   get:
 *     summary: Return synced ICD-11 TM2 concepts as a FHIR CodeSystem
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ICD-11 TM2 concepts as a FHIR R4 CodeSystem
 */
router.get(
  "/icd11-tm2",
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.CODER, ROLES.PATIENT, ROLES.ADMIN),
  getIcd11Tm2CodeSystem
);

/**
 * @openapi
 * /fhir/CodeSystem/icd11-biomedicine:
 *   get:
 *     summary: Return synced ICD-11 biomedicine concepts as a FHIR CodeSystem
 *     tags:
 *       - FHIR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ICD-11 biomedicine concepts as a FHIR R4 CodeSystem
 */
router.get(
  "/icd11-biomedicine",
  requireAuth,
  requireRole(ROLES.CLINICIAN, ROLES.CODER, ROLES.PATIENT, ROLES.ADMIN),
  getIcd11BiomedicineCodeSystem
);

module.exports = router;
