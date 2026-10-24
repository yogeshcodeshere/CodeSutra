const express = require("express");

const {
  createMappingHandler,
  createUserHandler,
  deleteMappingHandler,
  deleteUserHandler,
  demoResetHandler,
  listMappingsHandler,
  listUsersHandler,
  syncIcd11Handler,
  updateUserHandler
} = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ROLES } = require("../lib/rbac");

const router = express.Router();

/**
 * @openapi
 * /admin/sync/icd11:
 *   post:
 *     summary: Sync ICD-11 TM2 and biomedicine concepts
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [sample, live]
 *         description: Use sample demo data by default, or live WHO ICD API if credentials are configured.
 *     responses:
 *       200:
 *         description: Sync summary
 *       400:
 *         description: Invalid source query parameter
 */
router.post("/sync/icd11", requireAuth, requireRole(ROLES.ADMIN), syncIcd11Handler);

/**
 * @openapi
 * /admin/demo-reset:
 *   post:
 *     summary: Reset demo data and reseed sample terminology
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demo data reset summary
 */
router.post("/demo-reset", requireAuth, requireRole(ROLES.ADMIN), demoResetHandler);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List platform users (doctors and patients)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CLINICIAN, PATIENT, ADMIN]
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of registered users
 *   post:
 *     summary: Create a new user (doctor or patient)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created user
 */
router.get("/users", requireAuth, requireRole(ROLES.ADMIN), listUsersHandler);
router.post("/users", requireAuth, requireRole(ROLES.ADMIN), createUserHandler);
router.put("/users/:abhaId", requireAuth, requireRole(ROLES.ADMIN), updateUserHandler);
router.delete("/users/:abhaId", requireAuth, requireRole(ROLES.ADMIN), deleteUserHandler);

/**
 * @openapi
 * /admin/mappings:
 *   get:
 *     summary: List NAMASTE to ICD-11 mappings
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of mappings
 *   post:
 *     summary: Add or update a terminology mapping
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created or updated mapping
 */
router.get("/mappings", requireAuth, requireRole(ROLES.ADMIN), listMappingsHandler);
router.post("/mappings", requireAuth, requireRole(ROLES.ADMIN), createMappingHandler);
router.delete("/mappings/:id", requireAuth, requireRole(ROLES.ADMIN), deleteMappingHandler);

module.exports = router;
