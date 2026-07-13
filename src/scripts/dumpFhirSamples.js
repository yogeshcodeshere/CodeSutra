const fs = require("fs");
const path = require("path");

const { prisma } = require("../lib/prisma");
const { buildNamasteCodeSystem } = require("../services/codeSystemBuilder");
const { buildNamasteToTm2ConceptMap } = require("../services/conceptMapBuilder");
const { buildIcd11CodeSystem } = require("../services/icd11CodeSystemBuilder");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(relativePath), "utf8"));
}

function writeJson(outputDir, filename, value) {
  fs.writeFileSync(path.join(outputDir, filename), `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const outputDir = path.resolve("tmp/fhir_samples");
  const requestDir = path.join(outputDir, "requests");
  const responseDir = path.join(outputDir, "responses");
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(requestDir, { recursive: true });
  fs.mkdirSync(responseDir, { recursive: true });

  const responses = {
    "codesystem-namaste-response.json": await buildNamasteCodeSystem(),
    "codesystem-icd11-tm2-response.json": await buildIcd11CodeSystem("tm2"),
    "codesystem-icd11-biomedicine-response.json": await buildIcd11CodeSystem("biomedicine"),
    "conceptmap-namaste-to-tm2-response.json": await buildNamasteToTm2ConceptMap()
  };

  const requests = {
    "bundle-transaction-valid-request.json": readJson("data/fhir-request-samples/bundle-transaction-valid-request.json"),
    "bundle-transaction-namaste-only-request.json": readJson(
      "data/fhir-request-samples/bundle-transaction-namaste-only-request.json"
    ),
    "bundle-transaction-missing-consent-invalid-request.json": readJson(
      "data/fhir-request-samples/bundle-transaction-missing-consent-invalid-request.json"
    )
  };

  for (const [filename, resource] of Object.entries(responses)) {
    writeJson(responseDir, filename, resource);
  }

  for (const [filename, resource] of Object.entries(requests)) {
    writeJson(requestDir, filename, resource);
  }

  fs.writeFileSync(
    path.join(outputDir, "README.md"),
    [
      "# FHIR Samples",
      "",
      "## requests/",
      "",
      "Executable API request payloads for Swagger/Postman/manual testing.",
      "",
      "- `bundle-transaction-valid-request.json`: POST to `/fhir/Bundle`; contains NAMASTE and TM2 codings.",
      "- `bundle-transaction-namaste-only-request.json`: POST to `/fhir/Bundle`; contains only NAMASTE `NAM001`, and the API should auto-populate `TM2-001`.",
      "- `bundle-transaction-missing-consent-invalid-request.json`: negative POST `/fhir/Bundle` sample; expected HTTP 400.",
      "",
      "## responses/",
      "",
      "FHIR resource/response examples. Do not submit these as `/fhir/Bundle` request bodies.",
      "",
      "Optional external validation: `java -jar validator_cli.jar <file> -version 4.0`",
      ""
    ].join("\n")
  );

  console.log(`Wrote ${Object.keys(responses).length} response examples and ${Object.keys(requests).length} request payloads to ${outputDir}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
