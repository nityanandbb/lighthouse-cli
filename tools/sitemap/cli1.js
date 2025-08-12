/* eslint-disable no-console */
// cli.js

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const run = require("./index");

const argv = yargs(hideBin(process.argv))
  .option("url", {
    type: "string",
    demandOption: true,
    describe: "Site or sitemap URL",
  })
  .option("defaultSitemap", {
    type: "boolean",
    default: true,
    describe: "Append /sitemap.xml if needed",
  })
  .option("mode", {
    type: "string",
    default: "sample50",
    choices: ["sample50", "all", "perGroup", "random"],
  })
  .option("perGroup", {
    type: "number",
    default: 5,
    describe: "Max URLs per group (Case 3)",
  })
  .option("targetTotal", {
    type: "number",
    default: 50,
    describe: "Total URLs when sampling",
  })
  .option("include", {
    type: "array",
    default: [],
    describe: "Include prefixes (e.g. /en/ /products/)",
  })
  .option("exclude", {
    type: "array",
    default: [],
    describe: "Exclude prefixes",
  })
  .option("includeRe", {
    type: "string",
    default: "",
    describe: "Include regex (single pattern)",
  })
  .option("excludeRe", {
    type: "string",
    default: "",
    describe: "Exclude regex (single pattern)",
  })
  .option("concurrency", {
    type: "number",
    default: 8,
    describe: "Concurrency for sitemap fetch/validation",
  })
  .option("maxSitemaps", {
    type: "number",
    default: 1000,
    describe: "Hard cap for number of sitemap files to traverse",
  })
  .option("skipValidate", {
    type: "boolean",
    default: false,
    describe: "Skip HTTP 200 checks (fast local tests)",
  })
  .option("verbose", {
    type: "boolean",
    default: false,
    describe: "Extra logs",
  })
  .option("out", {
    type: "string",
    default: "TestURL.js",
    describe: "Output file path (default repo root)",
  })
  .help().argv;

run(argv).catch((err) => {
  console.error("🔥 Failed:", err);
  process.exit(1);
});
