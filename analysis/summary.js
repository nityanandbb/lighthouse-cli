// summary.js
const fs = require("fs");

function buildSummary({
  sitePath = "site_common_issues.json",
  out = "summary_report.json",
  top = 20,
} = {}) {
  const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
  const issues = site.common_issues || [];

  // bullets (≤6)
  const bullets = [];
  const add = (s) => {
    if (bullets.length < 6 && !bullets.includes(s)) bullets.push(s);
  };

  const any = (p) => issues.some(p);
  add(
    any(
      (ci) =>
        ["core_web_vitals", "javascript", "images"].includes(ci.area) &&
        ci.priority !== "low"
    ) &&
      "Slow loads on key pages—optimize Core Web Vitals and cut JS/image weight."
  ) || null;
  add(
    any((ci) => ci.audit_id === "unused-javascript") &&
      "Too much JavaScript; remove unused/duplicate code and split bundles."
  ) || null;
  add(
    any((ci) => ci.area === "images" && ci.priority !== "low") &&
      "Images are heavy or not responsive; convert to WebP/AVIF and size properly."
  ) || null;
  add(
    any((ci) => ci.area === "accessibility" && ci.priority !== "low") &&
      "Accessibility gaps (contrast/labels/lang) may impact compliance and UX."
  ) || null;
  add(
    any((ci) => ci.area === "network_caching" && ci.priority !== "low") &&
      "Weak caching/compression causes repeat downloads; enable long TTL and gzip/brotli."
  ) || null;
  add(
    any((ci) => ci.area === "seo" && ci.priority !== "low") &&
      "SEO basics missing (titles/meta/crawlability) reduce discoverability."
  ) || null;

  const topIssues = issues.slice(0, top);

  const summary = {
    management_summary: bullets.length
      ? bullets
      : ["Overall results look solid; keep monitoring Core Web Vitals."],
    top_common_issues: topIssues,
    generated_at: new Date().toISOString(),
    version: "lh-summary-v1",
  };
  fs.writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log(`✅ Wrote ${out}`);
}

if (require.main === module) {
  // CLI: node summary.js [site_common_issues.json] [topN]
  const sitePath = process.argv[2] || "site_common_issues.json";
  const top = Number(process.argv[3] || 20);
  buildSummary({ sitePath, top });
}

module.exports = { buildSummary };
