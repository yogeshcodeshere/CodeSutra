const express = require("express");

const { createProblemListHandler } = require("../controllers/problemList.controller");
const { ROLES } = require("../lib/rbac");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validate");
const { fhirBundleRequestSchema } = require("../schemas/fhirBundle.schema");

const router = express.Router();

/**
 * @openapi
 * /fhir/Bundle:
 *   post:
 *     summary: Ingest a FHIR transaction Bundle into the patient Problem List
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
 *           examples:
 *             namasteOnlyBundle:
 *               summary: NAMASTE-only Condition with Consent
 *               description: Same payload as data/fhir-request-samples/bundle-transaction-namaste-only-request.json. Submitting this as a CLINICIAN auto-populates the mapped ICD-11 TM2 code for NAM001.
 *               value:
 *                 resourceType: Bundle
 *                 type: transaction
 *                 entry:
 *                   - fullUrl: urn:uuid:condition-swagger-demo
 *                     resource:
 *                       resourceType: Condition
 *                       subject:
 *                         reference: Patient/swagger-demo-patient
 *                       clinicalStatus:
 *                         coding:
 *                           - system: http://terminology.hl7.org/CodeSystem/condition-clinical
 *                             code: active
 *                       code:
 *                         text: Swagger demo NAMASTE-only diagnosis
 *                         coding:
 *                           - system: https://namaste.ayush.gov.in/fhir/CodeSystem/namaste
 *                             code: NAM001
 *                             display: Jwara
 *                   - fullUrl: urn:uuid:consent-swagger-demo
 *                     resource:
 *                       resourceType: Consent
 *                       id: consent-swagger-demo
 *                       status: active
 *     responses:
 *       201:
 *         description: FHIR transaction-response Bundle
 *       400:
 *         description: Invalid Bundle
 */
router.post(
  "/",
  requireAuth,
  requireRole(ROLES.CLINICIAN),
  validateRequest(fhirBundleRequestSchema),
  createProblemListHandler
);

module.exports = router;
