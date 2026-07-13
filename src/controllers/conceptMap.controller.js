const { buildNamasteToTm2ConceptMap } = require("../services/conceptMapBuilder");

async function getNamasteToTm2ConceptMap(req, res, next) {
  try {
    const conceptMap = await buildNamasteToTm2ConceptMap();
    res.type("application/fhir+json").json(conceptMap);
  } catch (error) {
    next(error);
  }
}

module.exports = { getNamasteToTm2ConceptMap };
