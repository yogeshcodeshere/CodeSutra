const { prisma } = require("../lib/prisma");
const { seedDemoData } = require("../services/demoData");

async function main() {
  const summary = await seedDemoData();
  console.log(JSON.stringify({ status: "ok", ...summary }, null, 2));
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
