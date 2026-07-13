const fs = require("fs");
const path = require("path");

const csv = require("csv-parser");

const { prisma } = require("../lib/prisma");
const { mappingCsvRowSchema } = require("../schemas/mapping.schema");

function normalizeRow(rawRow) {
  return {
    namasteCode: rawRow.namasteCode || rawRow.namaste_code,
    tm2Code: rawRow.tm2Code || rawRow.tm2_code,
    equivalence: rawRow.equivalence,
    notes: rawRow.notes,
    confidence: rawRow.confidence,
    reviewedBy: rawRow.reviewedBy || rawRow.reviewed_by
  };
}

async function seedMappings(csvPath) {
  const absolutePath = path.resolve(csvPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const rows = await new Promise((resolve, reject) => {
    const collected = [];

    fs.createReadStream(absolutePath)
      .pipe(csv())
      .on("data", (row) => collected.push(row))
      .on("error", reject)
      .on("end", () => resolve(collected));
  });

  const summary = { added: 0, updated: 0, skipped: 0, skipReasons: [] };

  for (const rawRow of rows) {
    const parsed = mappingCsvRowSchema.safeParse(normalizeRow(rawRow));

    if (!parsed.success) {
      summary.skipped += 1;
      summary.skipReasons.push({
        row: rawRow,
        reason: parsed.error.issues.map((issue) => issue.message).join("; ")
      });
      continue;
    }

    const row = parsed.data;
    const existing = await prisma.namasteTm2Mapping.findUnique({
      where: {
        namasteCode_tm2Code: {
          namasteCode: row.namasteCode,
          tm2Code: row.tm2Code
        }
      }
    });

    await prisma.namasteTm2Mapping.upsert({
      where: {
        namasteCode_tm2Code: {
          namasteCode: row.namasteCode,
          tm2Code: row.tm2Code
        }
      },
      update: {
        equivalence: row.equivalence,
        notes: row.notes || null,
        confidence: row.confidence,
        reviewedBy: row.reviewedBy || null
      },
      create: {
        namasteCode: row.namasteCode,
        tm2Code: row.tm2Code,
        equivalence: row.equivalence,
        notes: row.notes || null,
        confidence: row.confidence,
        reviewedBy: row.reviewedBy || null
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
    throw new Error("Usage: node src/scripts/seedMappings.js <csvPath>");
  }

  const summary = await seedMappings(csvPath);
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

module.exports = { normalizeRow, seedMappings };
