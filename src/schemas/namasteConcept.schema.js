const { z } = require("zod");

const namasteCategorySchema = z.enum(["ayurveda", "siddha", "unani"]);

const namasteCsvRowSchema = z.object({
  code: z.string().trim().min(1),
  display: z.string().trim().min(1),
  category: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(namasteCategorySchema),
  definition: z.string().trim().optional().default(""),
  nativeTerm: z.string().trim().optional().default(""),
  version: z.string().trim().optional().default("2026-demo"),
  effectiveDate: z
    .string()
    .trim()
    .optional()
    .default(() => new Date().toISOString())
});

module.exports = { namasteCategorySchema, namasteCsvRowSchema };
