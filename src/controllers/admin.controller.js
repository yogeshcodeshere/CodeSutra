const { syncIcd11 } = require("../services/icd11Sync");
const { z } = require("zod");
const { resetDemoData } = require("../services/demoData");

const syncIcd11QuerySchema = z.object({
  source: z.enum(["sample", "live"]).default("sample")
});

function validationOutcome(message) {
  return {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: "error",
        code: "invalid",
        diagnostics: message
      }
    ]
  };
}

async function syncIcd11Handler(req, res, next) {
  try {
    // TODO Phase 5: protect this route with ADMIN-only authentication.
    const parsed = syncIcd11QuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res
        .status(400)
        .json(validationOutcome('Invalid source query parameter. Expected "sample" or "live".'));
    }

    const { source } = parsed.data;
    const summary = await syncIcd11({ source });
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

async function demoResetHandler(req, res, next) {
  try {
    const summary = await resetDemoData();
    res.json({ status: "ok", ...summary });
  } catch (error) {
    next(error);
  }
}

module.exports = { demoResetHandler, syncIcd11Handler, syncIcd11QuerySchema };
