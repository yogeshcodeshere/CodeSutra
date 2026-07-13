const { z } = require("zod");

const codeSystemConceptSchema = z.object({
  code: z.string().min(1),
  display: z.string().min(1),
  definition: z.string().optional(),
  property: z
    .array(
      z.object({
        code: z.string().min(1),
        valueString: z.string().min(1)
      })
    )
    .optional()
});

const fhirCodeSystemSchema = z.object({
  resourceType: z.literal("CodeSystem"),
  url: z.string().url(),
  version: z.string().min(1),
  status: z.enum(["draft", "active", "retired", "unknown"]),
  content: z.enum(["not-present", "example", "fragment", "complete", "supplement"]),
  concept: z.array(codeSystemConceptSchema)
});

module.exports = { fhirCodeSystemSchema };
