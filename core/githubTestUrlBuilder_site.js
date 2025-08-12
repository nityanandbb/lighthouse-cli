// core/githubTestUrlBuilder.js
/* Builds TestURL.js via your sitemap gatherer when MODE=1 (default), no changes to your existing code */
// >> revert 
const { spawnSync } = require("child_process");
const fs = require("fs");

function splitList(str) {
  if (!str) return [];
  return String(str)
    .split(/[\n, ]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function bool(v) {
  return String(v || "").toLowerCase() === "true";
}

(function main() {
  const MODE = process.env.MODE || "1";
  const BASE_URL = process.env.BASE_URL || "";
  const OUT_FILE = process.env.OUT_FILE || "TestURL.js";

  // Sampler knobs (defaults friendly for non-tech users)
  const PRESET = (process.env.SITEMAP_PRESET || "50x5").toLowerCase(); // "50x5" | "200x10" | "custom"
  let TARGET_TOTAL = Number(process.env.TARGET_TOTAL || 50);
  let PER_GROUP = Number(process.env.PER_GROUP || 5);

  if (PRESET === "200x10") {
    TARGET_TOTAL = 200;
    PER_GROUP = 10;
  } else if (PRESET !== "custom") {
    TARGET_TOTAL = 50;
    PER_GROUP = 5;
  }

  // Optional filters for Mode 1 (Sitemap)
  const START_WITH = splitList(process.env.START_WITH);
  const CONTAINS_ANY = splitList(process.env.CONTAINS_ANY);
  const CONTAINS_ALL = splitList(process.env.CONTAINS_ALL);
  const EXCLUDE = splitList(process.env.EXCLUDE);
  const INCLUDE_RE = process.env.INCLUDE_RE || "";
  const EXCLUDE_RE = process.env.EXCLUDE_RE || "";
  const MATCH_QUERY = bool(process.env.MATCH_QUERY);

  // Optional host rules (global sites)
  const ALLOW_SUBDOMAINS = bool(process.env.ALLOW_SUBDOMAINS);
  const ALLOW_HOSTS = splitList(process.env.ALLOW_HOSTS);
  const HOST_RE = process.env.HOST_RE || "";

  // Performance flags
  const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
  const MAX_SITEMAPS = Number(process.env.MAX_SITEMAPS || 1000);
  const SKIP_VALIDATE = bool(process.env.SKIP_VALIDATE);

  if (MODE !== "1") {
    console.log("ℹ️ MODE is not 1 (Sitemap). Skipping sitemap URL builder.");
    process.exit(0);
  }
  if (!BASE_URL) {
    console.error("❌ BASE_URL is required for MODE=1");
    process.exit(1);
  }

  // Build arg list for your gatherer CLI (no code changes to gatherer needed)
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

  // Filters
  START_WITH.forEach((v) => args.push("--startWith", v));
  CONTAINS_ANY.forEach((v) => args.push("--containsAny", v));
  CONTAINS_ALL.forEach((v) => args.push("--containsAll", v));
  EXCLUDE.forEach((v) => args.push("--exclude", v));
  if (INCLUDE_RE) args.push("--includeRe", INCLUDE_RE);
  if (EXCLUDE_RE) args.push("--excludeRe", EXCLUDE_RE);
  if (MATCH_QUERY) args.push("--matchQuery");

  // Host rules
  if (ALLOW_SUBDOMAINS) args.push("--allowSubdomains");
  ALLOW_HOSTS.forEach((h) => args.push("--allowHosts", h));
  if (HOST_RE) args.push("--hostRe", HOST_RE);

  // Perf
  args.push("--concurrency", String(CONCURRENCY));
  args.push("--maxSitemaps", String(MAX_SITEMAPS));
  if (SKIP_VALIDATE) args.push("--skipValidate");

  console.log("🧰 Running sitemap gatherer:\nnode", args.join(" "));

  const run = spawnSync("node", args, { stdio: "inherit" });
  if (run.status !== 0) {
    console.error("❌ Sitemap gatherer failed.");
    process.exit(run.status || 1);
  }

  if (!fs.existsSync(OUT_FILE)) {
    console.error(`❌ Expected ${OUT_FILE} but not found.`);
    process.exit(1);
  }
  console.log(`✅ URL list ready → ${OUT_FILE}`);
})();
