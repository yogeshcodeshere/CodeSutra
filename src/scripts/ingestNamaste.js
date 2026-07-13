const fs = require("fs");
const path = require("path");

const csv = require("csv-parser");

const { prisma } = require("../lib/prisma");
const { namasteCsvRowSchema } = require("../schemas/namasteConcept.schema");

function normalizeRow(rawRow) {
  return {
    code: rawRow.code,
    display: rawRow.display || rawRow.term,
    nativeTerm: rawRow.nativeTerm || rawRow.native_term || rawRow.native || rawRow.devanagari,
    definition: rawRow.definition || rawRow.short_definition,
    category: rawRow.category,
    version: rawRow.version,
    effectiveDate: rawRow.effectiveDate || rawRow.effective_date
  };
}

async function ingestNamasteCsv(csvPath) {
  const absolutePath = path.resolve(csvPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const summary = {
    added: 0,
    updated: 0,
    skipped: 0,
    skipReasons: []
  };

  const rows = await new Promise((resolve, reject) => {
    const collected = [];

    fs.createReadStream(absolutePath)
      .pipe(csv())
      .on("data", (row) => collected.push(row))
      .on("error", reject)
      .on("end", () => resolve(collected));
  });

  for (const rawRow of rows) {
    const parsed = namasteCsvRowSchema.safeParse(normalizeRow(rawRow));

    if (!parsed.success) {
      summary.skipped += 1;
      summary.skipReasons.push({
        row: rawRow,
        reason: parsed.error.issues.map((issue) => issue.message).join("; ")
      });
      continue;
    }

    const row = parsed.data;
    const existing = await prisma.namasteConcept.findUnique({
      where: { code: row.code }
    });

    await prisma.namasteConcept.upsert({
      where: { code: row.code },
      update: {
        display: row.display,
        definition: row.definition || null,
        category: row.category,
        nativeTerm: row.nativeTerm || null,
        version: row.version,
        effectiveDate: new Date(row.effectiveDate)
      },
      create: {
        code: row.code,
        display: row.display,
        definition: row.definition || null,
        category: row.category,
        nativeTerm: row.nativeTerm || null,
        version: row.version,
        effectiveDate: new Date(row.effectiveDate)
      }
    });

    if (existing) {
      summary.updated += 1;
    } else {
      summary.added += 1;
    }
  }

  return summary;
}

async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    throw new Error("Usage: node src/scripts/ingestNamaste.js <csvPath>");
  }

  const summary = await ingestNamasteCsv(csvPath);
  console.log(JSON.stringify(summary, null, 2));
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

module.exports = { ingestNamasteCsv, normalizeRow };
