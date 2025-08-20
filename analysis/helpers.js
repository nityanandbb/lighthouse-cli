// helpers.js

const fs = require("fs");
const path = require("path");

// --- Mappings ---
const AREA_MAP = {
  // CWV/perf
  "largest-contentful-paint":"core_web_vitals","first-contentful-paint":"core_web_vitals","speed-index":"core_web_vitals",
  "interactive":"core_web_vitals","total-blocking-time":"core_web_vitals","cumulative-layout-shift":"core_web_vitals",
  // JS/CSS/Network/Fonts/Images
  "unused-javascript":"javascript","duplicated-javascript":"javascript","legacy-javascript":"javascript","unminified-javascript":"javascript",
  "mainthread-work-breakdown":"javascript","bootup-time":"javascript",
  "unused-css-rules":"css","unminified-css":"css",
  "render-blocking-resources":"network_caching","uses-rel-preconnect":"network_caching","uses-rel-preload":"network_caching",
  "uses-long-cache-ttl":"network_caching","uses-text-compression":"network_caching","total-byte-weight":"network_caching",
  "preload-fonts":"fonts","font-display":"fonts",
  "modern-image-formats":"images","uses-optimized-images":"images","uses-responsive-images":"images","offscreen-images":"images","efficient-animated-content":"images",
  // Accessibility
  "color-contrast":"accessibility","image-alt":"accessibility","button-name":"accessibility","link-name":"accessibility","heading-order":"accessibility","label":"accessibility",
  "aria-allowed-attr":"accessibility","aria-required-attr":"accessibility","aria-valid-attr-value":"accessibility","aria-valid-attr":"accessibility",
  "form-field-multiple-labels":"accessibility","frame-title":"accessibility","duplicate-id-aria":"accessibility","duplicate-id-active":"accessibility",
  "html-has-lang":"accessibility","html-lang-valid":"accessibility","valid-lang":"accessibility","meta-viewport":"accessibility",
  "object-alt":"accessibility","video-caption":"accessibility","label-content-name-mismatch":"accessibility",
  // SEO
  "meta-description":"seo","document-title":"seo","crawlable-anchors":"seo","robots-txt":"seo","hreflang":"seo","canonical":"seo",
  "http-status-code":"seo","font-size":"seo","tap-targets":"seo","is-crawlable":"seo","structured-data":"seo"
};

const HOW_FIX = {
  // Perf/CWV
  "largest-contentful-paint":["Compress/resize hero image","Preload critical assets","Inline critical CSS","Reduce render-blocking"],
  "first-contentful-paint":["Inline critical CSS","Defer non-critical JS/CSS","Preconnect to critical origins"],
  "speed-index":["Prioritize above-the-fold content","Lazy-load below-the-fold assets"],
  "total-blocking-time":["Split long tasks","Code-split bundles","Defer non-critical JS"],
  "interactive":["Reduce JS on main thread","Defer third-party scripts"],
  "cumulative-layout-shift":["Set width/height for media","Reserve space for ads/embeds"],
  "unused-javascript":["Tree-shake & remove dead code","Lazy-load routes/components"],
  "unused-css-rules":["Purge unused CSS","Inline critical CSS"],
  "uses-optimized-images":["Use WebP/AVIF","Compress & size to display"],
  "uses-long-cache-ttl":["Enable far-future caching with hashed filenames"],
  "uses-text-compression":["Enable gzip/brotli for text assets"],
  "font-display":["Use `font-display: swap`"],
  "preload-fonts":["`<link rel='preload' as='font' crossorigin>` for above-the-fold fonts"],
  // A11y/SEO
  "color-contrast":["Adjust colors to meet WCAG AA contrast"],
  "link-name":["Provide descriptive accessible names for links"],
  "html-has-lang":["Set `<html lang='…'>`"],
  "frame-title":["Add meaningful `title` on iframes"],
  "meta-description":["Add unique meta description (~155 chars)"],
  "document-title":["Add descriptive `<title>`"]
};

// --- Helpers ---
function priorityFromScore(score) {
  if (score == null) return "high";
  if (score < 0.5) return "high";
  if (score < 0.9) return "medium";
  return "low";
}

function deviceFromReport(report) {
  const cs = report.configSettings || {};
  if (cs.emulatedFormFactor) return cs.emulatedFormFactor;
  if (cs.screenEmulation?.width) return cs.screenEmulation.width <= 480 ? "mobile" : "desktop";
  const ua = report.environment?.networkUserAgent || "";
  if (ua.includes("Mobile") || ua.includes("Android")) return "mobile";
  return "desktop";
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return null;
  const k=1024, sizes=["Bytes","KB","MB","GB"];
  const i=Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes/Math.pow(k,i)).toFixed(1))+" "+sizes[i];
}

function calculateSavings(audit) {
  const d=audit?.details||{};
  if (typeof d.overallSavingsMs==="number") return `${Math.round(d.overallSavingsMs)}ms`;
  if (typeof d.overallSavingsBytes==="number") return formatBytes(d.overallSavingsBytes);
  if (audit?.numericValue && audit?.id?.includes("unused")) return formatBytes(audit.numericValue);
  return null;
}

function pluckEvidence(audit, max=5) {
  const items = audit?.details?.items || [];
  const mapped = items.map(it => ({
    url: it.url || it.source || it.request?.url || it.selector || it.label || null,
    wastedMs: it.wastedMs ?? null,
    wastedBytes: it.wastedBytes ?? null,
    transferSize: it.transferSize ?? null,
    label: it.label ?? it.name ?? null
  })).filter(x => x.url || x.label);
  return { topItems: mapped.slice(0,max), moreCount: Math.max(0, mapped.length - Math.min(mapped.length, max)) };
}

function readReports(dir=".lighthouseci") {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".json") && f.startsWith("lhr-")); // avoid flags-*.json
  return files.map(f => {
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p,"utf8"));
    return {
      filename: f,
      url: data.finalUrl || data.requestedUrl,
      deviceType: deviceFromReport(data),
      data
    };
  }).filter(r => !!r.url);
}

module.exports = {
  AREA_MAP, HOW_FIX,
  priorityFromScore, calculateSavings, formatBytes,
  pluckEvidence, readReports
};
