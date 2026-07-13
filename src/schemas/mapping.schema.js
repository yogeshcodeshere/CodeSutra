const { z } = require("zod");

const mappingEquivalenceSchema = z.enum(["equivalent", "wider", "narrower", "relatedto", "unmatched"]);

const mappingCsvRowSchema = z.object({
  namasteCode: z.string().trim().min(1),
  tm2Code: z.string().trim().min(1),
  equivalence: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(mappingEquivalenceSchema),
  notes: z.string().trim().optional().default(""),
  confidence: z.coerce.number().min(0).max(1).optional().default(0.75),
  reviewedBy: z.string().trim().optional().default("demo-reviewer")
});

module.exports = { mappingCsvRowSchema, mappingEquivalenceSchema };
