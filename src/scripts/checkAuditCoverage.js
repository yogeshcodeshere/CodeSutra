const axios = require("axios");

const { prisma } = require("../lib/prisma");

async function main() {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const tokenResponse = await axios.post(`${baseUrl}/auth/mock-token`, {
    abhaId: "audit-checker",
    role: "CLINICIAN",
    facilityId: "facility-001"
  });
  const authorization = `Bearer ${tokenResponse.data.accessToken}`;

  const calls = [
    { method: "get", url: "/fhir/CodeSystem/namaste" },
    { method: "get", url: "/fhir/ValueSet/$expand?filter=fever" }
  ];

  for (const call of calls) {
    await axios({
      method: call.method,
      url: `${baseUrl}${call.url}`,
      headers: { Authorization: authorization }
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 100));

  const count = await prisma.auditLog.count({
    where: { actorAbhaId: "audit-checker" }
  });

  if (count < calls.length) {
    throw new Error(`Expected at least ${calls.length} audit rows, found ${count}.`);
  }

  console.log(`Audit coverage OK: found ${count} rows.`);
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
