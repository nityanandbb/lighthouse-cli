/* eslint-disable no-console */
//  tools / sitemap / cli.js;

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const run = require("./index");

const argv = yargs(hideBin(process.argv))
  .scriptName("sitemap:gather")
  .usage("Usage: $0 --url <siteOrSitemap> [options]")

  // Core
  .option("url", {
    type: "string",
    demandOption: true,
    describe:
      "Site or sitemap URL. If not ending with /sitemap.xml and --defaultSitemap=true, we'll append it.",
  })
  .option("defaultSitemap", {
    type: "boolean",
    default: true,
    describe: "Append /sitemap.xml to --url if missing",
  })

  // Sampling (now with flexible 'sample')
  .option("mode", {
    type: "string",
    default: "sample",
    choices: ["sample", "sample50", "all", "perGroup", "random"],
    describe:
      "Use 'sample' to set your own --targetTotal/--perGroup; 'sample50' keeps legacy 5-per-group default.",
  })
  .option("targetTotal", {
    type: "number",
    default: 50,
    describe: "Target total URLs when sampling (sample/sample50/random)",
  })
  .option("perGroup", {
    type: "number",
    default: 5,
    describe:
      "Max URLs per group (sample & perGroup use this; sample50 is fixed to 5)",
  })

  // Friendly path filters (aliases + canonical)
  .option("under", {
    // alias for starts-with list
    type: "array",
    default: [],
    describe:
      "PATH must start with ANY of these (OR). Example: /services/ /en/",
  })
  .option("hasAny", {
    // alias for contains-any
    type: "array",
    default: [],
    describe: "PATH must contain ANY of these (OR). Example: insights sku_ id",
  })
  .option("hasAll", {
    // alias for contains-all
    type: "array",
    default: [],
    describe: "PATH must contain ALL of these (AND). Example: en insights",
  })

  // Canonical names (still supported)
  .option("startWith", { type: "array", default: [] })
  .option("containsAny", { type: "array", default: [] })
  .option("containsAll", { type: "array", default: [] })
  .option("matchQuery", {
    type: "boolean",
    default: false,
    describe: "Apply contains* to ?query too",
  })

  // Legacy include/exclude (kept)
  .option("include", { type: "array", default: [] })
  .option("exclude", { type: "array", default: [] })
  .option("includeRe", { type: "string", default: "" })
  .option("excludeRe", { type: "string", default: "" })

  // Host rules (Option 6)
  .option("allowSubdomains", {
    type: "boolean",
    default: false,
    describe:
      "Include subdomains of the base host (e.g., foo.example.com). Default = same-origin only.",
  })
  .option("allowHosts", {
    type: "array",
    default: [],
    describe:
      "Extra hosts to allow (exact hostnames). Example: api.example.com media.example.com",
  })
  .option("hostRe", {
    type: "string",
    default: "",
    describe: 'Regex to allow hosts. Example: ".*\\.example\\.com$"',
  })

  // Perf / UX
  .option("concurrency", { type: "number", default: 8 })
  .option("maxSitemaps", { type: "number", default: 1000 })
  .option("skipValidate", { type: "boolean", default: false })
  .option("verbose", { type: "boolean", default: false })
  .option("out", { type: "string", default: "TestURL.js" })

  .help()
  .wrap(Math.min(100, yargs().terminalWidth())).argv;

// Normalize alias -> canonical
argv.startWith = [...(argv.startWith || []), ...(argv.under || [])];
argv.containsAny = [...(argv.containsAny || []), ...(argv.hasAny || [])];
argv.containsAll = [...(argv.containsAll || []), ...(argv.hasAll || [])];

run(argv).catch((err) => {
  console.error("🔥 Failed:", err && err.stack ? err.stack : err);
  process.exit(1);
});
