const express = require("express");

const router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check API health
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 */
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "namaste-icd11-terminology-service"
  });
});

module.exports = router;
