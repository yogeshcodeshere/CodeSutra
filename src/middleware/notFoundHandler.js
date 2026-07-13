function notFoundHandler(req, res) {
  res.status(404).json({
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: "error",
        code: "not-found",
        diagnostics: `No route found for ${req.method} ${req.originalUrl}`
      }
    ]
  });
}

module.exports = { notFoundHandler };
