const { z } = require("zod");

const conceptMapTargetSchema = z.object({
  code: z.string().min(1),
  display: z.string().optional(),
  equivalence: z.enum(["relatedto", "equivalent", "wider", "narrower", "unmatched"]),
  comment: z.string().optional()
});

const conceptMapElementSchema = z.object({
  code: z.string().min(1),
  display: z.string().optional(),
  target: z.array(conceptMapTargetSchema)
});

const fhirConceptMapSchema = z.object({
  resourceType: z.literal("ConceptMap"),
  url: z.string().url(),
  status: z.enum(["draft", "active", "retired", "unknown"]),
  sourceUri: z.string().url(),
  targetUri: z.string().url(),
  group: z.array(
    z.object({
      source: z.string().url(),
      target: z.string().url(),
      element: z.array(conceptMapElementSchema)
    })
  )
});

module.exports = { fhirConceptMapSchema };
