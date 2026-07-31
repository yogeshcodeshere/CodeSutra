const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const { errorHandler } = require("./middleware/errorHandler");
const { notFoundHandler } = require("./middleware/notFoundHandler");
const { auditLogger } = require("./middleware/auditLogger");
const { swaggerSpec } = require("./config/swagger");
const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const bundleRoutes = require("./routes/bundle.routes");
const codeSystemRoutes = require("./routes/codeSystem.routes");
const conceptMapRoutes = require("./routes/conceptMap.routes");
const healthRoutes = require("./routes/health.routes");
const patientRoutes = require("./routes/patient.routes");
const valueSetRoutes = require("./routes/valueSet.routes");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "2mb", type: ["application/json", "application/fhir+json"] }));
  app.use(morgan("combined"));

  app.get("/docs.json", (req, res) => {
    res.json(swaggerSpec);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/fhir", auditLogger);
  app.use("/admin", adminRoutes);
  app.use("/fhir/Bundle", bundleRoutes);
  app.use("/fhir/CodeSystem", codeSystemRoutes);
  app.use("/fhir/ConceptMap", conceptMapRoutes);
  app.use("/fhir/Patient", patientRoutes);
  app.use("/fhir/ValueSet", valueSetRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
