const { createProblemListFromBundle, readProblemList } = require("../services/problemList");

async function createProblemListHandler(req, res, next) {
  try {
    const result = await createProblemListFromBundle({
      bundle: req.validated.body,
      user: req.user
    });

    if (result.consentId) {
      res.locals.consentStatus = `consent:${result.consentId}`;
    }

    res.status(result.statusCode).type("application/fhir+json").json(result.body);
  } catch (error) {
    next(error);
  }
}

async function readProblemListHandler(req, res, next) {
  try {
    const { abhaId } = req.validated.params;
    const includeHistory = req.validated.query.includeHistory || false;

    if (req.user.role === "PATIENT" && req.user.abhaId !== abhaId) {
      return res.status(403).json({
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "forbidden",
            diagnostics: "Patients can only read their own Problem List."
          }
        ]
      });
    }

    const bundle = await readProblemList({ patientAbhaId: abhaId, includeHistory });
    res.type("application/fhir+json").json(bundle);
  } catch (error) {
    next(error);
  }
}

module.exports = { createProblemListHandler, readProblemListHandler };
