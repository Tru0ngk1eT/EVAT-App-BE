const base = require("./jest.config");

module.exports = {
  ...base,
  testMatch: ["**/test/integration/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};