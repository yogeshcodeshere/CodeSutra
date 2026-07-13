function validationOutcome(issues) {
  return {
    resourceType: "OperationOutcome",
    issue: issues.map((issue) => ({
      severity: "error",
      code: "invalid",
      diagnostics: `${issue.path.join(".") || "request"}: ${issue.message}`
    }))
  };
}

function validateRequest(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!parsed.success) {
      return res.status(400).json(validationOutcome(parsed.error.issues));
    }

    req.validated = parsed.data;
    return next();
  };
}

module.exports = { validateRequest, validationOutcome };
