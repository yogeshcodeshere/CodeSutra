const { prisma } = require("../lib/prisma");
const { ingestNamasteCsv } = require("../scripts/ingestNamaste");
const { seedMappings } = require("../scripts/seedMappings");
const { syncIcd11 } = require("./icd11Sync");
const { ROLES } = require("../lib/rbac");

const DEMO_USERS = [
  {
    abhaId: "clinician-demo",
    name: "Dr. Rajesh Sharma",
    role: ROLES.CLINICIAN,
    specialty: "Ayurveda Senior Consultant",
    facilityId: "facility-001",
    email: "rajesh.sharma@ayush.gov.in",
    phone: "+91-9876543210"
  },
  {
    abhaId: "clinician-siddha",
    name: "Dr. Ananya Iyer",
    role: ROLES.CLINICIAN,
    specialty: "Siddha Research Physician",
    facilityId: "facility-002",
    email: "ananya.iyer@ayush.gov.in",
    phone: "+91-9876543211"
  },
  {
    abhaId: "clinician-unani",
    name: "Dr. Mohammad Tariq",
    role: ROLES.CLINICIAN,
    specialty: "Unani Senior Hakim",
    facilityId: "facility-003",
    email: "mohammad.tariq@ayush.gov.in",
    phone: "+91-9876543212"
  },
  {
    abhaId: "patient-demo-001",
    name: "Aarav Patel",
    role: ROLES.PATIENT,
    facilityId: "facility-001",
    email: "aarav.patel@example.com",
    phone: "+91-9123456780"
  },
  {
    abhaId: "patient-demo-002",
    name: "Meera Sen",
    role: ROLES.PATIENT,
    facilityId: "facility-001",
    email: "meera.sen@example.com",
    phone: "+91-9123456781"
  },
  {
    abhaId: "prashant thakur",
    name: "Prashant Thakur",
    role: ROLES.PATIENT,
    facilityId: "facility-001",
    email: "prashant.thakur@example.com",
    phone: "+91-9123456782"
  },
  {
    abhaId: "admin-demo",
    name: "Dr. Vikram Malhotra",
    role: ROLES.ADMIN,
    specialty: "Chief Medical Officer & Terminology Admin",
    facilityId: "facility-001",
    email: "admin@codesutra.ayush.gov.in",
    phone: "+91-9899001122"
  }
];

async function seedDemoData() {
  const namaste = await ingestNamasteCsv("data/sample-namaste.csv");
  const icd11 = await syncIcd11({ source: "sample" });
  const mappings = await seedMappings("data/sample-mappings.csv");

  let usersAdded = 0;
  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { abhaId: user.abhaId },
      update: {
        name: user.name,
        role: user.role,
        specialty: user.specialty || null,
        facilityId: user.facilityId,
        email: user.email,
        phone: user.phone
      },
      create: user
    });
    usersAdded += 1;
  }

  return { namaste, icd11, mappings, users: { count: usersAdded } };
}

async function resetDemoData() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.problemListEntry.deleteMany(),
    prisma.namasteTm2Mapping.deleteMany(),
    prisma.icd11Concept.deleteMany(),
    prisma.namasteConcept.deleteMany(),
    prisma.user.deleteMany()
  ]);

  return seedDemoData();
}

module.exports = { DEMO_USERS, resetDemoData, seedDemoData };
