const { spawnSync } = require("child_process");
const path = require("path");

const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required before running tests.");
}

if (!/(_test|test_)/i.test(testDatabaseUrl)) {
  throw new Error(`Refusing to prepare a non-test database: ${testDatabaseUrl}`);
}

process.env.DATABASE_URL = testDatabaseUrl;

const databaseName = new URL(testDatabaseUrl).pathname.replace("/", "");

const createDb = spawnSync(
  "docker",
  ["compose", "exec", "-T", "postgres", "createdb", "-U", "namaste", databaseName],
  { cwd: process.cwd(), encoding: "utf8" }
);

if (createDb.status !== 0 && !String(createDb.stderr).includes("already exists")) {
  process.stderr.write(createDb.stderr);
  process.stderr.write(createDb.stdout);
  throw new Error(`Unable to create test database ${databaseName}`);
}

const prismaBin = path.resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");

const prismaPush = spawnSync(process.execPath, [prismaBin, "db", "push", "--skip-generate"], {
  cwd: process.cwd(),
  encoding: "utf8",
  env: { ...process.env, DATABASE_URL: testDatabaseUrl }
});

process.stdout.write(prismaPush.stdout || "");
process.stderr.write(prismaPush.stderr || "");

if (prismaPush.status !== 0) {
  if (prismaPush.error) {
    throw prismaPush.error;
  }

  throw new Error("Unable to sync Prisma schema to the test database.");
}
