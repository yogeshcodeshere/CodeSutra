const { prisma } = require("../lib/prisma");
const { syncIcd11 } = require("../services/icd11Sync");

async function main() {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const source = sourceArg?.split("=")[1] === "live" ? "live" : "sample";
  const summary = await syncIcd11({ source });
  console.log(JSON.stringify({ source, ...summary }, null, 2));
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
