const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { ROLES } = require("../lib/rbac");
const { syncIcd11 } = require("../services/icd11Sync");
const { resetDemoData } = require("../services/demoData");

const syncIcd11QuerySchema = z.object({
  source: z.enum(["sample", "live"]).default("sample")
});

const userSchema = z.object({
  abhaId: z.string().min(1),
  name: z.string().min(1),
  role: z.enum([ROLES.CLINICIAN, ROLES.PATIENT, ROLES.ADMIN]),
  facilityId: z.string().optional().nullable(),
  specialty: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
});

const userUpdateSchema = z.object({
  name: z.string().optional(),
  role: z.enum([ROLES.CLINICIAN, ROLES.PATIENT, ROLES.ADMIN]).optional(),
  facilityId: z.string().optional().nullable(),
  specialty: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
});

const mappingSchema = z.object({
  namasteCode: z.string().min(1),
  tm2Code: z.string().min(1),
  equivalence: z.enum(["equivalent", "wider", "narrower", "relatedto", "unmatched"]).default("relatedto"),
  notes: z.string().optional().default(""),
  confidence: z.coerce.number().min(0).max(1).default(0.8),
  reviewedBy: z.string().optional().default("admin"),
  namasteDisplay: z.string().optional(),
  namasteCategory: z.enum(["ayurveda", "siddha", "unani"]).optional().default("ayurveda"),
  tm2Title: z.string().optional()
});

function validationOutcome(message) {
  return {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: "error",
        code: "invalid",
        diagnostics: message
      }
    ]
  };
}

async function syncIcd11Handler(req, res, next) {
  try {
    const parsed = syncIcd11QuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res
        .status(400)
        .json(validationOutcome('Invalid source query parameter. Expected "sample" or "live".'));
    }

    const { source } = parsed.data;
    const summary = await syncIcd11({ source });
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

async function demoResetHandler(req, res, next) {
  try {
    const summary = await resetDemoData();
    res.json({ status: "ok", ...summary });
  } catch (error) {
    next(error);
  }
}

// User Management Handlers
async function listUsersHandler(req, res, next) {
  try {
    const { role, query } = req.query;
    const where = {};

    if (role && [ROLES.CLINICIAN, ROLES.PATIENT, ROLES.ADMIN].includes(role)) {
      where.role = role;
    }

    if (query) {
      where.OR = [
        { abhaId: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { specialty: { contains: query, mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" }
    });

    res.json({ total: users.length, users });
  } catch (error) {
    next(error);
  }
}

async function createUserHandler(req, res, next) {
  try {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationOutcome(parsed.error.issues.map((i) => i.message).join("; ")));
    }

    const { abhaId, name, role, facilityId, specialty, email, phone } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { abhaId } });

    if (existing) {
      return res.status(409).json(validationOutcome(`User with ABHA ID ${abhaId} already exists.`));
    }

    const user = await prisma.user.create({
      data: {
        abhaId,
        name,
        role,
        facilityId: facilityId || null,
        specialty: specialty || null,
        email: email || null,
        phone: phone || null
      }
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function updateUserHandler(req, res, next) {
  try {
    const { abhaId } = req.params;
    const parsed = userUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(validationOutcome(parsed.error.issues.map((i) => i.message).join("; ")));
    }

    const existing = await prisma.user.findUnique({ where: { abhaId } });
    if (!existing) {
      return res.status(404).json(validationOutcome(`User ${abhaId} not found.`));
    }

    const updated = await prisma.user.update({
      where: { abhaId },
      data: parsed.data
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteUserHandler(req, res, next) {
  try {
    const { abhaId } = req.params;
    const existing = await prisma.user.findUnique({ where: { abhaId } });

    if (!existing) {
      return res.status(404).json(validationOutcome(`User ${abhaId} not found.`));
    }

    await prisma.user.delete({ where: { abhaId } });
    res.json({ status: "deleted", abhaId });
  } catch (error) {
    next(error);
  }
}

// Mapping Management Handlers
async function listMappingsHandler(req, res, next) {
  try {
    const { filter, limit = "50", offset = "0" } = req.query;
    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = Math.max(parseInt(offset, 10) || 0, 0);

    const where = {};
    if (filter) {
      where.OR = [
        { namasteCode: { contains: filter, mode: "insensitive" } },
        { tm2Code: { contains: filter, mode: "insensitive" } },
        { notes: { contains: filter, mode: "insensitive" } },
        { equivalence: { contains: filter, mode: "insensitive" } }
      ];
    }

    const [total, mappings] = await Promise.all([
      prisma.namasteTm2Mapping.count({ where }),
      prisma.namasteTm2Mapping.findMany({
        where,
        take,
        skip,
        orderBy: { id: "asc" }
      })
    ]);

    // Attach concept labels for ease of display in UI
    const namasteCodes = mappings.map((m) => m.namasteCode);
    const tm2Codes = mappings.map((m) => m.tm2Code);

    const [namasteConcepts, icdConcepts] = await Promise.all([
      prisma.namasteConcept.findMany({ where: { code: { in: namasteCodes } } }),
      prisma.icd11Concept.findMany({ where: { code: { in: tm2Codes } } })
    ]);

    const namasteMap = new Map(namasteConcepts.map((c) => [c.code, c]));
    const icdMap = new Map(icdConcepts.map((c) => [c.code, c]));

    const enriched = mappings.map((m) => ({
      ...m,
      namasteDisplay: namasteMap.get(m.namasteCode)?.display || m.namasteCode,
      namasteCategory: namasteMap.get(m.namasteCode)?.category || "ayurveda",
      tm2Title: icdMap.get(m.tm2Code)?.title || m.tm2Code
    }));

    res.json({ total, limit: take, offset: skip, mappings: enriched });
  } catch (error) {
    next(error);
  }
}

async function createMappingHandler(req, res, next) {
  try {
    const parsed = mappingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationOutcome(parsed.error.issues.map((i) => i.message).join("; ")));
    }

    const data = parsed.data;

    // Check if NAMASTE concept exists; if not and display provided, create it
    if (data.namasteDisplay) {
      await prisma.namasteConcept.upsert({
        where: { code: data.namasteCode },
        update: { display: data.namasteDisplay, category: data.namasteCategory },
        create: {
          code: data.namasteCode,
          display: data.namasteDisplay,
          category: data.namasteCategory,
          definition: data.notes || data.namasteDisplay,
          version: "2026-user",
          effectiveDate: new Date()
        }
      });
    }

    // Check if ICD concept exists; if not and title provided, create it
    if (data.tm2Title) {
      await prisma.icd11Concept.upsert({
        where: { entityId: `tm2-custom-${data.tm2Code.toLowerCase()}` },
        update: { code: data.tm2Code, title: data.tm2Title },
        create: {
          entityId: `tm2-custom-${data.tm2Code.toLowerCase()}`,
          code: data.tm2Code,
          title: data.tm2Title,
          definition: data.notes || data.tm2Title,
          chapter: "tm2",
          parentId: "chapter-26",
          uri: `https://id.who.int/icd/entity/tm2-custom-${data.tm2Code.toLowerCase()}`
        }
      });
    }

    const mapping = await prisma.namasteTm2Mapping.upsert({
      where: {
        namasteCode_tm2Code: {
          namasteCode: data.namasteCode,
          tm2Code: data.tm2Code
        }
      },
      update: {
        equivalence: data.equivalence,
        notes: data.notes || null,
        confidence: data.confidence,
        reviewedBy: data.reviewedBy || "admin"
      },
      create: {
        namasteCode: data.namasteCode,
        tm2Code: data.tm2Code,
        equivalence: data.equivalence,
        notes: data.notes || null,
        confidence: data.confidence,
        reviewedBy: data.reviewedBy || "admin"
      }
    });

    res.status(201).json(mapping);
  } catch (error) {
    next(error);
  }
}

async function deleteMappingHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json(validationOutcome("Invalid mapping ID"));
    }

    const existing = await prisma.namasteTm2Mapping.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(validationOutcome(`Mapping ID ${id} not found.`));
    }

    await prisma.namasteTm2Mapping.delete({ where: { id } });
    res.json({ status: "deleted", id });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMappingHandler,
  createUserHandler,
  deleteMappingHandler,
  deleteUserHandler,
  demoResetHandler,
  listMappingsHandler,
  listUsersHandler,
  syncIcd11Handler,
  syncIcd11QuerySchema,
  updateUserHandler
};
