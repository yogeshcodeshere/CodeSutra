const { expandValueSet, lookupCode, translateCode } = require("../services/terminologyOps");

async function expandValueSetHandler(req, res, next) {
  try {
    const { filter, count } = req.validated.query;
    const valueSet = await expandValueSet(filter, count);
    res.type("application/fhir+json").json(valueSet);
  } catch (error) {
    next(error);
  }
}

async function lookupCodeHandler(req, res, next) {
  try {
    const { system, code } = req.validated.query;
    const result = await lookupCode(system, code);
    res.status(result.statusCode).type("application/fhir+json").json(result.body);
  } catch (error) {
    next(error);
  }
}

async function translateCodeHandler(req, res, next) {
  try {
    const parameters = await translateCode(req.validated.body);
    res.type("application/fhir+json").json(parameters);
  } catch (error) {
    next(error);
  }
}

module.exports = { expandValueSetHandler, lookupCodeHandler, translateCodeHandler };
