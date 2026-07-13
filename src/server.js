const { env } = require("./config/env");
const { createApp } = require("./app");

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`NAMASTE ICD-11 API listening on port ${env.PORT}`);
});
