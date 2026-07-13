const swaggerJSDoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NAMASTE ICD-11 FHIR Terminology API",
      version: "0.1.0",
      description: "FHIR R4 terminology microservice for NAMASTE and ICD-11 TM2 dual coding."
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./src/routes/**/*.js"]
});

module.exports = { swaggerSpec };
