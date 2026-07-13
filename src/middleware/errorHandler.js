function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || err.status || 500;

  return res.status(status).json({
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: status >= 500 ? "error" : "warning",
        code: status >= 500 ? "exception" : "processing",
        diagnostics: err.message || "Unexpected error"
      }
    ]
  });
}

module.exports = { errorHandler };
