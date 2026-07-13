const { z } = require("zod");

const codingSchema = z.object({
  system: z.string().url(),
  code: z.string().min(1),
  display: z.string().optional()
});

const fhirValueSetSchema = z.object({
  resourceType: z.literal("ValueSet"),
  expansion: z.object({
    total: z.number().int().nonnegative(),
    contains: z.array(codingSchema)
  })
});

const parameterValueSchema = z.object({
  name: z.string().min(1),
  valueString: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  valueCode: z.string().optional(),
  valueCoding: codingSchema.optional(),
  part: z.array(z.any()).optional()
});

const fhirParametersSchema = z.object({
  resourceType: z.literal("Parameters"),
  parameter: z.array(parameterValueSchema)
});

const expandRequestSchema = z.object({
  query: z.object({
    filter: z.string().trim().min(1),
    count: z.coerce.number().int().min(1).max(100).default(20)
  }),
  body: z.any(),
  params: z.any()
});

const lookupRequestSchema = z.object({
  query: z.object({
    system: z.string().url(),
    code: z.string().trim().min(1)
  }),
  body: z.any(),
  params: z.any()
});

const translateRequestSchema = z.object({
  body: z.object({
    system: z.string().url(),
    code: z.string().trim().min(1),
    targetSystem: z.string().url().optional()
  }),
  query: z.any(),
  params: z.any()
});

module.exports = {
  expandRequestSchema,
  fhirParametersSchema,
  fhirValueSetSchema,
  lookupRequestSchema,
  translateRequestSchema
};
