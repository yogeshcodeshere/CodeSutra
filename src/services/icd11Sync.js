const fs = require("fs");
const path = require("path");

const { prisma } = require("../lib/prisma");
const whoIcdClient = require("./whoIcdClient");
const { env } = require("../config/env");

const TM2_CHAPTER_CODE = "26";
const MAX_TM2_LIVE_ENTITIES = 250;

function loadSampleConcepts() {
  const samplePath = path.resolve("data/sample-icd11.json");
  return JSON.parse(fs.readFileSync(samplePath, "utf8"));
}

function normalizeWhoEntity(entity, chapter) {
  const uri = entity["@id"] || entity.uri;
  const entityId = uri?.split("/").pop() || entity.entityId || entity.code;
  const code = entity.code || entity.theCode || entity.classKind || entityId;
  const title = entity.title?.["@value"] || entity.title || entity.label?.["@value"] || entity.label || entityId;
  const definition =
    entity.definition?.["@value"] ||
    entity.definition ||
    entity.longDefinition?.["@value"] ||
    entity.longDefinition ||
    null;

  return {
    entityId,
    code,
    title,
    definition,
    chapter,
    parentId: entity.parent?.[0]?.split("/").pop() || entity.parentId || null,
    uri
  };
}

function summarizeSync(source, processed, failures) {
  let status = "ok";

  if (processed === 0 && failures.length > 0) {
    status = "failed";
  } else if (failures.length > 0) {
    status = "partial";
  }

  return { status, source, processed, failures };
}

async function upsertConcept(concept) {
  return prisma.icd11Concept.upsert({
    where: { entityId: concept.entityId },
    update: {
      code: concept.code,
      title: concept.title,
      definition: concept.definition || null,
      chapter: concept.chapter,
      parentId: concept.parentId || null,
      uri: concept.uri
    },
    create: {
      entityId: concept.entityId,
      code: concept.code,
      title: concept.title,
      definition: concept.definition || null,
      chapter: concept.chapter,
      parentId: concept.parentId || null,
      uri: concept.uri
    }
  });
}

async function syncFromSample() {
  const concepts = loadSampleConcepts();
  let processed = 0;
  const failures = [];

  for (const concept of concepts) {
    try {
      await upsertConcept(concept);
      processed += 1;
    } catch (error) {
      failures.push({ entityId: concept.entityId, reason: error.message });
    }
  }

  return summarizeSync("sample", processed, failures);
}

function getChildUris(entity) {
  return [...(entity.child || []), ...(entity.children || [])].filter(Boolean);
}

function isTm2Chapter(entity) {
  const code = String(entity.code || entity.theCode || "");
  const title = String(entity.title?.["@value"] || entity.title || "").toLowerCase();

  return code === TM2_CHAPTER_CODE || title.includes("traditional medicine");
}

async function discoverTm2RootUri(releaseId) {
  const linearization = await whoIcdClient.getLinearization(releaseId, "mms");
  const chapterUris = getChildUris(linearization);

  for (const chapterUri of chapterUris) {
    const chapter = await whoIcdClient.getLinearizationEntity(chapterUri, releaseId, "mms");

    if (isTm2Chapter(chapter)) {
      return chapter["@id"] || chapterUri;
    }
  }

  throw new Error(`Unable to discover ICD-11 MMS chapter ${TM2_CHAPTER_CODE} TM2 root from release ${releaseId}`);
}

function getUriFromCodeInfo(codeInfo) {
  return (
    codeInfo.linearizationUri ||
    codeInfo.linearizationURI ||
    codeInfo.uri ||
    codeInfo["@id"] ||
    codeInfo.stemId ||
    codeInfo.foundationUri
  );
}

function getFirstSearchResultUri(searchResult) {
  const results = searchResult.destinationEntities || searchResult.entities || searchResult.matches || [];
  const first = Array.isArray(results) ? results[0] : null;

  return first?.id || first?.theCodeUri || first?.uri || first?.linearizationUri || first?.foundationUri;
}

async function discoverTargetUri(target, releaseId) {
  if (target.code) {
    const codeInfo = await whoIcdClient.getCodeInfo(target.code, releaseId, "mms");
    const uri = getUriFromCodeInfo(codeInfo);

    if (uri) {
      return uri;
    }
  }

  if (target.searchText || target.label) {
    const searchResult = await whoIcdClient.searchEntities(target.searchText || target.label, {
      releaseId,
      linearization: "mms",
      useFlexisearch: true
    });
    const uri = getFirstSearchResultUri(searchResult);

    if (uri) {
      return uri;
    }
  }

  throw new Error(`Unable to discover ICD-11 URI for target ${target.label || target.code}`);
}

async function syncTm2Chapter({ releaseId, processedRef, failures, queue }) {
  const tm2RootUri = await discoverTm2RootUri(releaseId);
  queue.push({ uri: tm2RootUri, chapter: "tm2" });

  const seen = new Set();

  while (queue.length > 0 && processedRef.value < MAX_TM2_LIVE_ENTITIES) {
    const item = queue.shift();

    if (seen.has(item.uri)) {
      continue;
    }

    seen.add(item.uri);

    try {
      const entity = await whoIcdClient.getLinearizationEntity(item.uri, releaseId, "mms");
      const concept = normalizeWhoEntity(entity, item.chapter);
      await upsertConcept(concept);
      processedRef.value += 1;

      for (const childUri of getChildUris(entity)) {
        queue.push({ uri: childUri, chapter: item.chapter });
      }
    } catch (error) {
      failures.push({ uri: item.uri, chapter: item.chapter, reason: error.message });
    }
  }
}

async function syncBiomedicineTargets({ releaseId, targets, processedRef, failures }) {
  for (const target of targets) {
    try {
      const uri = await discoverTargetUri(target, releaseId);
      const entity = await whoIcdClient.getLinearizationEntity(uri, releaseId, "mms");
      const concept = normalizeWhoEntity(entity, "biomedicine");
      await upsertConcept(concept);
      processedRef.value += 1;
    } catch (error) {
      failures.push({
        label: target.label,
        code: target.code,
        searchText: target.searchText,
        chapter: "biomedicine",
        reason: error.message
      });
    }
  }
}

async function syncFromWhoApi(options = {}) {
  const targets = JSON.parse(fs.readFileSync(path.resolve("data/biomedicineTargets.json"), "utf8"));
  const releaseId = options.releaseId || env.WHO_ICD_RELEASE_ID;
  const processedRef = { value: 0 };
  const failures = [];

  try {
    await syncTm2Chapter({ releaseId, processedRef, failures, queue: [] });
  } catch (error) {
    failures.push({ chapter: "tm2", reason: error.message });
  }

  await syncBiomedicineTargets({ releaseId, targets, processedRef, failures });

  return summarizeSync("live", processedRef.value, failures);
}

async function syncIcd11(options = {}) {
  if (options.source === "live") {
    return syncFromWhoApi(options);
  }

  return syncFromSample();
}

module.exports = {
  discoverTargetUri,
  discoverTm2RootUri,
  getFirstSearchResultUri,
  getUriFromCodeInfo,
  loadSampleConcepts,
  normalizeWhoEntity,
  summarizeSync,
  syncIcd11,
  syncFromSample,
  syncFromWhoApi
};
