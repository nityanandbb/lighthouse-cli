// core/sitemapUrlBuilder.js
// Build TestURL.js from a sitemap (Mode 1) — does NOT touch your old builders.

const { spawnSync } = require("child_process");
const fs = require("fs");

const C = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};
const splitList = (s) =>
  !s
    ? []
    : String(s)
        .split(/[\n,\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
const bool = (v) => String(v || "").toLowerCase() === "true";

(function main() {
  const MODE = process.env.MODE || "1";
  if (MODE !== "1") {
    console.log(
      `${C.cyan}ℹ️ sitemapUrlBuilder: MODE=${MODE}, skipping.${C.reset}`
    );
    process.exit(0);
  }

  const BASE_URL = process.env.BASE_URL || "";
  const OUT_FILE = process.env.OUT_FILE || "TestURL.js";
  if (!BASE_URL) {
    console.error(`${C.red}❌ BASE_URL required for Mode 1${C.reset}`);
    process.exit(1);
  }

  // Presets
  const PRESET = (process.env.SITEMAP_PRESET || "50x5").toLowerCase();
  let TARGET_TOTAL = Number(process.env.TARGET_TOTAL || 50);
  let PER_GROUP = Number(process.env.PER_GROUP || 5);
  if (PRESET === "200x10") {
    TARGET_TOTAL = 200;
    PER_GROUP = 10;
  } else if (PRESET !== "custom") {
    TARGET_TOTAL = 50;
    PER_GROUP = 5;
  }

  // Filters
  const START_WITH = splitList(process.env.START_WITH);
  const CONTAINS_ANY = splitList(process.env.CONTAINS_ANY);
  const CONTAINS_ALL = splitList(process.env.CONTAINS_ALL);
  const EXCLUDE = splitList(process.env.EXCLUDE);
  const INCLUDE_RE = process.env.INCLUDE_RE || "";
  const EXCLUDE_RE = process.env.EXCLUDE_RE || "";
  const MATCH_QUERY = bool(process.env.MATCH_QUERY);

  // Host rules
  const ALLOW_SUBDOMAINS = bool(process.env.ALLOW_SUBDOMAINS);
  const ALLOW_HOSTS = splitList(process.env.ALLOW_HOSTS);
  const HOST_RE = process.env.HOST_RE || "";

  // Perf
  const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
  const MAX_SITEMAPS = Number(process.env.MAX_SITEMAPS || 1000);
  const SKIP_VALIDATE = bool(process.env.SKIP_VALIDATE);

  const args = [
    "tools/sitemap/cli.js",
    "--url",
    BASE_URL,
    "--mode",
    "sample",
    "--targetTotal",
    String(TARGET_TOTAL),
    "--perGroup",
    String(PER_GROUP),
    "--out",
    OUT_FILE,
  ];

  START_WITH.forEach((v) => args.push("--startWith", v));
  CONTAINS_ANY.forEach((v) => args.push("--containsAny", v));
  CONTAINS_ALL.forEach((v) => args.push("--containsAll", v));
  EXCLUDE.forEach((v) => args.push("--exclude", v));
  if (INCLUDE_RE) args.push("--includeRe", INCLUDE_RE);
  if (EXCLUDE_RE) args.push("--excludeRe", EXCLUDE_RE);
  if (MATCH_QUERY) args.push("--matchQuery");

  if (ALLOW_SUBDOMAINS) args.push("--allowSubdomains");
  ALLOW_HOSTS.forEach((h) => args.push("--allowHosts", h));
  if (HOST_RE) args.push("--hostRe", HOST_RE);

  args.push("--concurrency", String(CONCURRENCY));
  args.push("--maxSitemaps", String(MAX_SITEMAPS));
  if (SKIP_VALIDATE) args.push("--skipValidate");

  console.log(
    `${C.blue}🧰 Running sitemap gatherer:${C.reset}\nnode ${args.join(" ")}`
  );
  const run = spawnSync("node", args, { stdio: "inherit" });
  if (run.status !== 0) {
    console.error(`${C.red}❌ Sitemap gatherer failed.${C.reset}`);
    process.exit(run.status || 1);
  }

  if (!fs.existsSync(OUT_FILE)) {
    console.error(`${C.red}❌ Expected ${OUT_FILE} not found.${C.reset}`);
    process.exit(1);
  }
  console.log(`${C.green}✅ URL list ready → ${OUT_FILE}${C.reset}`);
})();
