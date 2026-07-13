const path = require("path");

const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for Jest. Tests must not use the development database.");
}

if (!/(_test|test_)/i.test(testDatabaseUrl)) {
  throw new Error(`Refusing to run tests against a non-test database: ${testDatabaseUrl}`);
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";
