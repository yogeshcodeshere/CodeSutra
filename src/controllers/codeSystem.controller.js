const { buildNamasteCodeSystem } = require("../services/codeSystemBuilder");
const { buildIcd11CodeSystem } = require("../services/icd11CodeSystemBuilder");

async function getNamasteCodeSystem(req, res, next) {
  try {
    const codeSystem = await buildNamasteCodeSystem();
    res.type("application/fhir+json").json(codeSystem);
  } catch (error) {
    next(error);
  }
}

async function getIcd11Tm2CodeSystem(req, res, next) {
  try {
    const codeSystem = await buildIcd11CodeSystem("tm2");
    res.type("application/fhir+json").json(codeSystem);
  } catch (error) {
    next(error);
  }
}

async function getIcd11BiomedicineCodeSystem(req, res, next) {
  try {
    const codeSystem = await buildIcd11CodeSystem("biomedicine");
    res.type("application/fhir+json").json(codeSystem);
  } catch (error) {
    next(error);
  }
}

module.exports = { getIcd11BiomedicineCodeSystem, getIcd11Tm2CodeSystem, getNamasteCodeSystem };
