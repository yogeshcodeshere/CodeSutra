const express = require("express");

const { syncIcd11Handler } = require("../controllers/admin.controller");
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

module.exports = router;
