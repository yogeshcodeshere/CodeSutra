const { z } = require("zod");

const codingSchema = z.object({
  system: z.string().url(),
  code: z.string().min(1),
  display: z.string().optional()
});

const fhirBundleRequestSchema = z.object({
  body: z.object({
    resourceType: z.literal("Bundle"),
    type: z.literal("transaction"),
    entry: z.array(
      z.object({
        fullUrl: z.string().optional(),
        resource: z.record(z.any())
      })
    )
  }),
  query: z.any(),
  params: z.any()
});

const problemListReadRequestSchema = z.object({
  params: z.object({
    abhaId: z.string().min(1)
  }),
  query: z.object({
    includeHistory: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true")
  }),
  body: z.any()
});

module.exports = { codingSchema, fhirBundleRequestSchema, problemListReadRequestSchema };
