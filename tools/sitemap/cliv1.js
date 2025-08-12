// tools/sitemap/cli.js
/* eslint-disable no-console */
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const run = require("./index");

const argv = yargs(hideBin(process.argv))
  .scriptName("sitemap:gather")
  .usage("Usage: $0 --url <siteOrSitemap> [options]")
  .option("url", {
    type: "string",
    demandOption: true,
    describe:
      "Site or sitemap URL. If it doesn't end with /sitemap.xml and --defaultSitemap=true, we'll append /sitemap.xml",
  })
  .option("defaultSitemap", {
    type: "boolean",
    default: true,
    describe: "Append /sitemap.xml to --url if it doesn't already end with it",
  })

  // Modes / sampling (added "sample")
  .option("mode", {
    type: "string",
    default: "sample50",
    choices: ["sample", "sample50", "all", "perGroup", "random"],
    describe:
      "Sampling mode. Use 'sample' for your own --targetTotal/--perGroup, or 'sample50' (legacy default).",
  })
  .option("perGroup", {
    type: "number",
    default: 5,
    describe:
      "Max URLs per group (perGroup & sample use this; sample50 uses fixed 5)",
  })
  .option("targetTotal", {
    type: "number",
    default: 50,
    describe: "Total URLs when sampling (sample/sample50/random)",
  })

  // Legacy include/exclude
  .option("include", { type: "array", default: [] })
  .option("exclude", { type: "array", default: [] })
  .option("includeRe", { type: "string", default: "" })
  .option("excludeRe", { type: "string", default: "" })

  // Combo filters
  .option("startWith", { type: "array", default: [] })
  .option("containsAny", { type: "array", default: [] })
  .option("containsAll", { type: "array", default: [] })
  .option("matchQuery", { type: "boolean", default: false })

  // Perf / Dev
  .option("concurrency", { type: "number", default: 8 })
  .option("maxSitemaps", { type: "number", default: 1000 })
  .option("skipValidate", { type: "boolean", default: false })
  .option("verbose", { type: "boolean", default: false })
  .option("out", { type: "string", default: "TestURL.js" })

  .example(
    "$0 --url https://test.abc.com --mode=sample --targetTotal=200 --perGroup=10 --out ./TestURL.js"
  )
  .help()
  .wrap(Math.min(100, yargs().terminalWidth())).argv;

run(argv).catch((err) => {
  console.error("🔥 Failed:", err && err.stack ? err.stack : err);
  process.exit(1);
});
