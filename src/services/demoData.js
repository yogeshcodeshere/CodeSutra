const { prisma } = require("../lib/prisma");
const { ingestNamasteCsv } = require("../scripts/ingestNamaste");
const { seedMappings } = require("../scripts/seedMappings");
const { syncIcd11 } = require("./icd11Sync");

async function seedDemoData() {
  const namaste = await ingestNamasteCsv("data/sample-namaste.csv");
  const icd11 = await syncIcd11({ source: "sample" });
  const mappings = await seedMappings("data/sample-mappings.csv");

  return { namaste, icd11, mappings };
}

async function resetDemoData() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.problemListEntry.deleteMany(),
    prisma.namasteTm2Mapping.deleteMany(),
    prisma.icd11Concept.deleteMany(),
    prisma.namasteConcept.deleteMany()
  ]);

  return seedDemoData();
}

module.exports = { resetDemoData, seedDemoData };
