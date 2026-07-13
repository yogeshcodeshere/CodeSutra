const axios = require("axios");

const { env } = require("../config/env");
const { cache } = require("../lib/cache");

const TOKEN_CACHE_KEY = "who-icd-access-token";
const TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const http = axios.create({
  baseURL: env.WHO_ICD_API_BASE,
  timeout: 15000
});

function sanitizeHeaders(headers = {}) {
  const sanitized = { ...headers };

  if (sanitized.Authorization) {
    sanitized.Authorization = "Bearer <redacted>";
  }

  return sanitized;
}

function logWhoError(error) {
  const status = error.response?.status;

  if (process.env.NODE_ENV === "production" || status !== 400) {
    return;
  }

  console.warn(
    "WHO ICD API 400 response",
    JSON.stringify(
      {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        headers: sanitizeHeaders(error.config?.headers),
        response: error.response?.data
      },
      null,
      2
    )
  );
}

http.interceptors.response.use(undefined, async (error) => {
  const config = error.config || {};
  const status = error.response?.status;
  const shouldRetry = status === 429 || status >= 500;

  if (!shouldRetry || config.__retryCount >= 3) {
    logWhoError(error);
    return Promise.reject(error);
  }

  config.__retryCount = (config.__retryCount || 0) + 1;
  await sleep(250 * config.__retryCount);
  return http(config);
});

async function getAccessToken() {
  const cached = cache.get(TOKEN_CACHE_KEY);

  if (cached) {
    return cached;
  }

  const body = new URLSearchParams({
    client_id: env.WHO_ICD_CLIENT_ID,
    client_secret: env.WHO_ICD_CLIENT_SECRET,
    scope: "icdapi_access",
    grant_type: "client_credentials"
  });

  let response;

  try {
    response = await axios.post(TOKEN_URL, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
  } catch (error) {
    logWhoError({
      ...error,
      config: {
        ...error.config,
        url: TOKEN_URL,
        headers: sanitizeHeaders(error.config?.headers)
      }
    });

    const status = error.response?.status;
    const details = error.response?.data ? `: ${JSON.stringify(error.response.data)}` : "";
    throw new Error(`WHO ICD token request failed${status ? ` with HTTP ${status}` : ""}${details}`);
  }

  const token = response.data.access_token;
  const ttlMs = Math.max((response.data.expires_in || 3600) - 60, 60) * 1000;
  cache.set(TOKEN_CACHE_KEY, token, ttlMs);

  return token;
}

async function authorizedHeaders() {
  const token = await getAccessToken();

  return {
    Authorization: `Bearer ${token}`,
    "API-Version": "v2",
    "Accept-Language": "en",
    Accept: "application/json"
  };
}

async function getEntity(uri) {
  const response = await http.get(uri, {
    headers: await authorizedHeaders()
  });

  return response.data;
}

async function getLinearization(releaseId = env.WHO_ICD_RELEASE_ID, linearization = "mms") {
  const response = await http.get(`/icd/release/11/${releaseId}/${linearization}`, {
    headers: await authorizedHeaders()
  });

  return response.data;
}

async function getLinearizationEntity(uriOrId, releaseId = env.WHO_ICD_RELEASE_ID, linearization = "mms") {
  const id = extractEntityId(uriOrId);
  const response = await http.get(`/icd/release/11/${releaseId}/${linearization}/${id}`, {
    headers: await authorizedHeaders()
  });

  return response.data;
}

async function getCodeInfo(code, releaseId = env.WHO_ICD_RELEASE_ID, linearization = "mms") {
  const response = await http.get(`/icd/release/11/${releaseId}/${linearization}/codeinfo/${encodeURIComponent(code)}`, {
    headers: await authorizedHeaders()
  });

  return response.data;
}

async function describeCodeOrUri({ code, uri }, releaseId = env.WHO_ICD_RELEASE_ID, linearization = "mms") {
  const response = await http.get(`/icd/release/11/${releaseId}/${linearization}/describe`, {
    headers: await authorizedHeaders(),
    params: {
      ...(code ? { code } : {}),
      ...(uri ? { uri } : {})
    }
  });

  return response.data;
}

async function searchEntities(query, options = {}) {
  const releaseId = options.releaseId || env.WHO_ICD_RELEASE_ID;
  const linearization = options.linearization || "mms";
  const response = await http.get(`/icd/release/11/${releaseId}/${linearization}/search`, {
    headers: await authorizedHeaders(),
    params: {
      q: query,
      flatResults: true,
      includeKeywordResult: false,
      medicalCodingMode: options.medicalCodingMode ?? true,
      useFlexisearch: options.useFlexisearch ?? false,
      ...(options.chapterFilter ? { chapterFilter: options.chapterFilter } : {}),
      ...(options.subtreesFilter ? { subtreesFilter: options.subtreesFilter } : {})
    }
  });

  return response.data;
}

function extractEntityId(uriOrId) {
  return String(uriOrId).split("/").filter(Boolean).pop();
}

module.exports = {
  authorizedHeaders,
  describeCodeOrUri,
  extractEntityId,
  getAccessToken,
  getCodeInfo,
  getEntity,
  getLinearization,
  getLinearizationEntity,
  searchEntities
};
