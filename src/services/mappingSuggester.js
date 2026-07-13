const { prisma } = require("../lib/prisma");

function tokenize(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

function overlapScore(sourceTokens, targetTokens) {
  if (sourceTokens.size === 0 || targetTokens.size === 0) {
    return 0;
  }

  let overlap = 0;

  for (const token of sourceTokens) {
    if (targetTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(sourceTokens.size, targetTokens.size);
}

async function suggestMappingCandidates(namasteCode) {
  const namasteConcept = await prisma.namasteConcept.findUnique({
    where: { code: namasteCode }
  });

  if (!namasteConcept) {
    return [];
  }

  const sourceTokens = tokenize(`${namasteConcept.display} ${namasteConcept.definition || ""}`);
  const tm2Concepts = await prisma.icd11Concept.findMany({
    where: { chapter: "tm2" }
  });

  // Human-review helper only: these scores are never written to NamasteTm2Mapping automatically.
  return tm2Concepts
    .map((concept) => ({
      code: concept.code,
      display: concept.title,
      score: overlapScore(sourceTokens, tokenize(`${concept.title} ${concept.definition || ""}`))
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

module.exports = { suggestMappingCandidates };
