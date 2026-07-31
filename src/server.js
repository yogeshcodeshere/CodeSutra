const { env } = require("./config/env");
const { createApp } = require("./app");

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`CodeSutra API listening on port ${env.PORT}`);
});
