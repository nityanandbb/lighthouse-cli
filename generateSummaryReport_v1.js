#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";

/**
 * generateSummaryReport_v8.js
 * ------------------------------------------------------------
 * Creates a concise HTML “summary-only” report from:
 *  - summary_report.json         -> { management_summary: string[] }
 *  - site_common_issues.json     -> { common_issues: IssueAggregate[] }
 *
 * Defaults:
 *   - Priority mode = "lighthouse"
 *   - Accessibility issues EXCLUDED (enable via --include-accessibility=true)
 *
 * Validation:
 *   - Run with --validate to check input JSONs for common mistakes.
 *   - If errors exist -> exit 1 and do NOT write report.
 *   - If only warnings -> proceed to generate report (unless --validate-only).
 *
 * Commands / Examples:
 *   - Default (LH priority, A11Y off):      node generateSummaryReport_v8.js
 *   - Include Accessibility issues:         node generateSummaryReport_v8.js --include-accessibility=true
 *   - Use explicit priorities:              node generateSummaryReport_v8.js --priority=explicit
 *   - Validate then build:                  node generateSummaryReport_v8.js --validate
 *   - Validate only (no build):             node generateSummaryReport_v8.js --validate --validate-only
 *   - Custom caps/paths:
 *       node generateSummaryReport_v8.js --max-per-priority=8 --max-summary=5 --summary=summary_report.json --site=site_common_issues.json --out=dist
 *
 * Expected JSON (site_common_issues.json):
 * {
 *   "common_issues": [
 *     {
 *       "issue_title": "Largest Contentful Paint too slow",   // or "issue"
 *       "priority": "high|medium|low",                        // optional if using LH mode
 *       "avg_score": 0.42,                                    // or "score"/"average_score" (0..1)
 *       "affected_count": 12,                                 // optional; inferred from affected_urls if missing
 *       "affected_urls": ["https://example.com/home", "..."],
 *       "area": "performance|images|javascript|css|fonts|network_caching|core_web_vitals|accessibility|seo|...",
 *       "why_it_matters": "Slow LCP reduces conversions...",
 *       "how_to_fix": ["Compress hero image", "Preload hero font"], // string or string[]
 *       "effort": "quick_win|large_project"
 *     }
 *   ]
 * }
 *
 * Expected JSON (summary_report.json):
 * {
 *   "management_summary": [
 *     "Short, plain-language bullet 1",
 *     "Short, plain-language bullet 2"
 *   ]
 * }
 *
 * ------------------------------------------------------------
 * FUTURE NOTES / TODOs:
 *   - --categories=perf,seo,accessibility,core_web_vitals to include/exclude by area.
 *   - --max-total-issues cap across all priorities (e.g., max 12 lines total).
 *   - Export CSV/JSON alongside HTML (e.g., --export=csv,json).
 *   - Optional PDF export via headless browser.
 *   - Add per-category score chips or trend diffs between runs.
 * ------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

/* ============================
 * CLI OPTIONS
 * ============================ */

/** Parse argv into a simple key/value map. */
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

/**
 * Safely parse boolean-like CLI values.
 * @param {unknown} v
 * @param {boolean} def Default value if v is undefined
 * @returns {boolean}
 */
function parseBool(v, def = false) {
  if (v === undefined) return def;
  const s = String(v).toLowerCase().trim();
  return ["1", "true", "yes", "on"].includes(s);
}

// Defaults: Lighthouse priority, Accessibility excluded
const PRIORITY_MODE = String(args["priority"] || "lighthouse"); // explicit | lighthouse | hybrid
const INCLUDE_A11Y = parseBool(args["include-accessibility"], false); // DEFAULT: false
const DO_VALIDATE = parseBool(args["validate"], false);
const VALIDATE_ONLY = parseBool(args["validate-only"], false);
const MAX_PER_PRIORITY = Number(args["max-per-priority"] || 6);
const MAX_SUMMARY = Number(args["max-summary"] || 6);
const SUMMARY_PATH = String(args["summary"] || "summary_report.json");
const SITE_PATH = String(args["site"] || "site_common_issues.json");
const OUT_DIR = String(args["out"] || ".");

/* ============================
 * UTILS
 * ============================ */

/**
 * Read a JSON file with fallback on error.
 * @param {string} file
 * @param {any} fallback
 * @returns {any}
 */
function readJSON(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return fallback;
  }
}

/**
 * Basic HTML escaper to avoid breaking markup.
 * @param {string} [s]
 * @returns {string}
 */
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Priority ordering for sorting. */
const priorityOrder = { high: 3, medium: 2, low: 1 };

/**
 * Color chip for priority badge.
 * @param {"high"|"medium"|"low"} p
 * @returns {string}
 */
function prioColor(p) {
  return p === "high" ? "#b71c1c" : p === "medium" ? "#ef6c00" : "#2e7d32";
}

/**
 * Clamp arbitrary priority to one of "low" | "medium" | "high".
 * @param {string} p
 * @returns {"low"|"medium"|"high"}
 */
function clampPrio(p) {
  return p === "high" || p === "medium" ? p : "low";
}

/**
 * Return the worse (higher risk) of two priorities.
 * @param {"low"|"medium"|"high"} a
 * @param {"low"|"medium"|"high"} b
 * @returns {"low"|"medium"|"high"}
 */
function worsePriority(a, b) {
  const A = priorityOrder[clampPrio(a)] || 0;
  const B = priorityOrder[clampPrio(b)] || 0;
  return A >= B ? clampPrio(a) : clampPrio(b);
}

/**
 * Return a readable path (keeps original as href).
 * @param {string} [u]
 * @returns {string}
 */
function cleanUrl(u = "") {
  try {
    const url = new URL(u);
    return url.pathname + (url.search || "");
  } catch {
    return u;
  }
}

/**
 * Short fix hint (≤2 steps).
 * @param {string|string[]|null|undefined} howToFix
 * @returns {string|null}
 */
function shortFix(howToFix) {
  if (!howToFix) return null;
  if (Array.isArray(howToFix))
    return howToFix.filter(Boolean).slice(0, 2).join("; ");
  return String(howToFix);
}

/**
 * ISO filename-friendly timestamp.
 * @returns {string}
 */
function nowStamp() {
  return new Date().toISOString().replace(/:/g, "-");
}

/* ============================
 * LIGHTHOUSE PRIORITY MAPPING
 * ============================ */

/**
 * Map Lighthouse audit score (0..1) to priority.
 * <0.50 => high, 0.50–0.89 => medium, 0.90–<1 => low, 1.00 => low
 * @param {number|null|undefined} score
 * @returns {"low"|"medium"|"high"|null}
 */
function lhScoreToPriority(score) {
  if (score == null || isNaN(score)) return null;
  const s = Number(score);
  if (s < 0.5) return "high";
  if (s < 0.9) return "medium";
  if (s < 1) return "low";
  return "low";
}

/**
 * Escalate priority by prevalence (affected pages).
 * +1 level if >=10, +2 levels if >=30.
 * @param {"low"|"medium"|"high"} basePriority
 * @param {number} affectedCount
 * @returns {"low"|"medium"|"high"}
 */
function escalateByAffected(basePriority, affectedCount) {
  if (!affectedCount || affectedCount < 10) return basePriority;
  const order = ["low", "medium", "high"];
  let idx = order.indexOf(clampPrio(basePriority));
  if (affectedCount >= 30) idx = Math.min(idx + 2, 2);
  else idx = Math.min(idx + 1, 2);
  return order[idx];
}

/**
 * Derive final priority per configured mode.
 * Modes:
 *  - explicit: use raw.priority, fallback to LH mapping if available
 *  - lighthouse: use LH mapping (then prevalence), fallback to explicit
 *  - hybrid: take worse(explicit, lighthouse-with-prevalence)
 * @param {{avg_score?:number, score?:number, average_score?:number, affected_count?:number}} fields
 * @param {string|undefined} explicitPriority
 * @returns {"low"|"medium"|"high"}
 */
function derivePriority(fields, explicitPriority) {
  const explicit = explicitPriority
    ? clampPrio(String(explicitPriority).toLowerCase())
    : null;

  const score =
    fields.avg_score ?? fields.score ?? fields.average_score ?? null;

  const fromLH = lhScoreToPriority(score);
  const withPrev = fromLH
    ? escalateByAffected(fromLH, fields.affected_count || 0)
    : null;

  if (PRIORITY_MODE === "explicit") return explicit || withPrev || "low";
  if (PRIORITY_MODE === "lighthouse") return withPrev || explicit || "low";
  // hybrid -> worse of both
  if (explicit && withPrev) return worsePriority(explicit, withPrev);
  return explicit || withPrev || "low";
}

/* ============================
 * DATA NORMALIZATION
 * ============================ */

/**
 * Normalize raw issue object into a stable shape for rendering.
 * Skips entries without a title.
 * @param {any} raw
 * @returns {null | {
 *   title:string,
 *   area:string,
 *   affected_urls:string[],
 *   affected_count:number,
 *   example_url:string,
 *   why:string,
 *   how_to_fix:string|string[]|null,
 *   effort:string|null,
 *   score:number|null,
 *   priority:"low"|"medium"|"high"
 * }}
 */
function normalizeIssue(raw = {}) {
  const title = (raw.issue_title ?? raw.issue ?? "").trim();
  if (!title) return null;

  const urls = Array.isArray(raw.affected_urls)
    ? raw.affected_urls.filter(Boolean)
    : [];
  const affected_count =
    Number(raw.affected_count) > 0
      ? Number(raw.affected_count)
      : urls.length || 0;

  const area = (raw.area || raw.category || "").toString().toLowerCase();

  const norm = {
    title,
    area,
    affected_urls: urls,
    affected_count,
    example_url: urls.length ? urls[0] : "",
    why: raw.why_it_matters || "",
    how_to_fix: raw.how_to_fix ?? raw.fix ?? null,
    effort: raw.effort || null,
    score: raw.avg_score ?? raw.score ?? raw.average_score ?? null,
  };

  norm.priority = derivePriority(norm, raw.priority);
  return norm;
}

/**
 * Sort issues by priority (desc), then affected_count (desc), then title (asc).
 * @param {Array<ReturnType<typeof normalizeIssue>>} issues
 * @returns {typeof issues}
 */
function prioritize(issues) {
  return [...issues].sort((a, b) => {
    const pr = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (pr) return pr;
    const cnt = (b.affected_count || 0) - (a.affected_count || 0);
    if (cnt) return cnt;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Group issues into { high, medium, low } buckets.
 * @param {Array<ReturnType<typeof normalizeIssue>>} issues
 * @returns {{ high:any[], medium:any[], low:any[] }}
 */
function groupByPriority(issues) {
  return issues.reduce(
    (acc, it) => {
      acc[it.priority].push(it);
      return acc;
    },
    { high: [], medium: [], low: [] }
  );
}

/* ============================
 * MANAGEMENT SUMMARY
 * ============================ */

/**
 * Generate a plain-language management summary if none provided.
 * Prefers unique "why_it_matters" lines from the worst issues.
 * @param {Array<ReturnType<typeof normalizeIssue>>} issues
 * @param {number} max
 * @returns {string[]}
 */
function synthesizeManagementSummary(issues, max = 6) {
  if (!issues.length) {
    return [
      "No site-wide issues found in inputs.",
      "Re-run Lighthouse on key templates (home, PLP, PDP, blog, contact) to validate coverage.",
    ];
  }
  const seen = new Set();
  const bullets = [];
  for (const it of prioritize(issues)) {
    const why = (it.why || "").trim();
    if (why && !seen.has(why)) {
      bullets.push(why);
      seen.add(why);
    }
    if (bullets.length >= max) break;
  }
  if (!bullets.length) {
    bullets.push(
      "Multiple high-priority issues affect key pages; address these first to protect UX and SEO.",
      "Largest wins likely from reducing JS/CSS weight, optimizing hero media, and enabling caching/compression.",
      "Fixing accessibility basics (contrast, labels, language) improves compliance and usability."
    );
  }
  return bullets.slice(0, max);
}

/* ============================
 * VALIDATION
 * ============================ */

/**
 * Validate summary_report.json shape.
 * @param {any} data
 * @returns {{errors:string[], warnings:string[]}}
 */
function validateSummaryData(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== "object") {
    errors.push(
      "summary_report.json must be a JSON object with a 'management_summary' array."
    );
    return { errors, warnings };
  }

  if (!Array.isArray(data.management_summary)) {
    warnings.push(
      "management_summary missing or not an array (a synthesized summary will be used)."
    );
  } else {
    const bad = data.management_summary.findIndex((x) => typeof x !== "string");
    if (bad !== -1) {
      errors.push(`management_summary[${bad}] must be a string.`);
    }
  }

  return { errors, warnings };
}

/**
 * Validate site_common_issues.json shape.
 * @param {any} data
 * @returns {{errors:string[], warnings:string[]}}
 */
function validateIssuesData(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== "object") {
    errors.push(
      "site_common_issues.json must be a JSON object with a 'common_issues' array."
    );
    return { errors, warnings };
  }

  if (!Array.isArray(data.common_issues)) {
    errors.push("'common_issues' is missing or not an array.");
    return { errors, warnings };
  }

  const allowedPrio = new Set(["low", "medium", "high"]);
  data.common_issues.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") {
      errors.push(`common_issues[${i}] must be an object.`);
      return;
    }

    const title = (raw.issue_title ?? raw.issue ?? "").trim();
    if (!title) {
      errors.push(`common_issues[${i}] is missing 'issue_title' (or 'issue').`);
    }

    if (raw.priority != null) {
      const p = String(raw.priority).toLowerCase();
      if (!allowedPrio.has(p)) {
        errors.push(
          `common_issues[${i}].priority must be one of "low|medium|high"; received "${raw.priority}".`
        );
      }
    }

    const score = raw.avg_score ?? raw.score ?? raw.average_score;
    if (score != null) {
      const n = Number(score);
      if (!(n >= 0 && n <= 1)) {
        errors.push(
          `common_issues[${i}].score must be in [0..1]; received "${score}".`
        );
      }
    }

    if (raw.affected_count != null && !(Number(raw.affected_count) >= 0)) {
      errors.push(
        `common_issues[${i}].affected_count must be a non-negative number if provided.`
      );
    }

    if (raw.affected_urls != null) {
      if (!Array.isArray(raw.affected_urls)) {
        errors.push(
          `common_issues[${i}].affected_urls must be an array of strings if provided.`
        );
      } else {
        const badUrlIdx = raw.affected_urls.findIndex(
          (u) => typeof u !== "string" || !u.trim()
        );
        if (badUrlIdx !== -1) {
          errors.push(
            `common_issues[${i}].affected_urls[${badUrlIdx}] must be a non-empty string.`
          );
        }
      }
    }

    if (
      raw.how_to_fix != null &&
      !(typeof raw.how_to_fix === "string" || Array.isArray(raw.how_to_fix))
    ) {
      warnings.push(
        `common_issues[${i}].how_to_fix should be a string or an array of strings.`
      );
    }

    if (raw.area != null && typeof raw.area !== "string") {
      warnings.push(
        `common_issues[${i}].area should be a string (e.g., "performance", "accessibility").`
      );
    }

    if (raw.why_it_matters != null && typeof raw.why_it_matters !== "string") {
      warnings.push(`common_issues[${i}].why_it_matters should be a string.`);
    }
  });

  return { errors, warnings };
}

/**
 * Print a formatted validation report.
 * @param {{errors:string[], warnings:string[]}} summaryRes
 * @param {{errors:string[], warnings:string[]}} issuesRes
 * @returns {{errorCount:number, warningCount:number}}
 */
function printValidationReport(summaryRes, issuesRes) {
  const errors = [...summaryRes.errors, ...issuesRes.errors];
  const warnings = [...summaryRes.warnings, ...issuesRes.warnings];

  const hr = () => console.log("—".repeat(60));

  hr();
  console.log("Validation Results");
  hr();

  if (errors.length) {
    console.log(`❌ Errors (${errors.length}):`);
    errors.slice(0, 50).forEach((e, idx) => console.log(`  ${idx + 1}. ${e}`));
    if (errors.length > 50) console.log(`  ...and ${errors.length - 50} more.`);
  } else {
    console.log("✅ No errors.");
  }

  if (warnings.length) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings
      .slice(0, 50)
      .forEach((w, idx) => console.log(`  ${idx + 1}. ${w}`));
    if (warnings.length > 50)
      console.log(`  ...and ${warnings.length - 50} more.`);
  } else {
    console.log("\nℹ️  No warnings.");
  }

  hr();
  return { errorCount: errors.length, warningCount: warnings.length };
}

/* ============================
 * RENDER
 * ============================ */

/**
 * Build the final HTML string for the report.
 * @param {string[]} summaryPoints
 * @param {Array<ReturnType<typeof normalizeIssue>>} issues
 * @param {number} maxPerPriority
 * @returns {string}
 */
function renderHTML(summaryPoints, issues, maxPerPriority) {
  const byPrio = groupByPriority(prioritize(issues));

  const liSummary =
    (summaryPoints || [])
      .filter(Boolean)
      .slice(0, MAX_SUMMARY)
      .map((p) => `<li>${escapeHtml(p)}</li>`)
      .join("") || "<li>No management summary available.</li>";

  /**
   * Render one issue row.
   * @param {ReturnType<typeof normalizeIssue>} it
   * @returns {string}
   */
  function renderIssue(it) {
    const fix = shortFix(it.how_to_fix);
    const examplePath = cleanUrl(it.example_url);
    const areaChip = it.area
      ? `<span class="chip">${escapeHtml(it.area)}</span>`
      : "";
    const effortChip = it.effort
      ? `<span class="chip muted">${escapeHtml(
          String(it.effort).replace("_", " ")
        )}</span>`
      : "";
    const urlHtml = it.example_url
      ? `• e.g. <a href="${escapeHtml(
          it.example_url
        )}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(
          examplePath
        )}</code></a>`
      : "";

    return `
      <li class="issue">
        <span class="badge" style="background:${prioColor(
          it.priority
        )}">${it.priority.toUpperCase()}</span>
        <span class="title">${escapeHtml(it.title)}</span>
        ${areaChip}${effortChip}
        <div class="meta">affects <b>${
          it.affected_count
        }</b> page(s) ${urlHtml}</div>
        ${fix ? `<div class="fix">Fix: ${escapeHtml(fix)}</div>` : ""}
      </li>`;
  }

  /**
   * Render a priority block (High/Medium/Low).
   * @param {string} label
   * @param {ReturnType<typeof normalizeIssue>[]} arr
   * @returns {string}
   */
  function renderBlock(label, arr) {
    const items = (arr || [])
      .slice(0, maxPerPriority)
      .map(renderIssue)
      .join("");
    if (!items) return "";
    return `<h3>${label}</h3><ul class="issues">${items}</ul>`;
  }

  const a11yNote = INCLUDE_A11Y
    ? ""
    : `<div class="note">Accessibility issues are hidden (run with <code>--include-accessibility=true</code> to include).</div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Lighthouse Summary Report</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 28px; color:#1b1b1b; }
    h1 { text-align:center; margin: 0 0 24px; }
    h2 { margin: 24px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #333; }
    h3 { margin: 18px 0 8px; }
    .card { border:1px solid #e0e0e0; border-radius:10px; padding:18px 20px; background:#fafafa; }
    ul { margin: 8px 0 0 18px; padding:0; }
    li { margin: 8px 0; }
    .issues { list-style: none; margin-left:0; }
    .issue { padding:10px 12px; background:#fff; border:1px solid #eee; border-radius:10px; box-shadow:0 1px 0 rgba(0,0,0,.02); }
    .badge { display:inline-block; color:#fff; font-size:12px; font-weight:700; padding:2px 8px; border-radius:999px; margin-right:8px; }
    .title { font-weight:600; }
    .meta { color:#555; margin-top:2px; }
    .fix { color:#2e7d32; font-style:italic; margin-top:6px; }
    code { background:#f1f3f5; padding:1px 6px; border-radius:6px; }
    .chip { display:inline-block; font-size:11px; padding:2px 8px; border-radius:999px; background:#eaf2ff; color:#0a47a9; margin-left:8px; }
    .chip.muted { background:#f1f3f5; color:#555; }
    .note { margin-top:10px; font-size:12px; color:#555; }
    footer { margin-top:22px; color:#666; font-size:12px; }
    a { color:inherit; text-decoration: none; border-bottom:1px dotted #777; }
    a:hover { border-bottom-style: solid; }
  </style>
</head>
<body>
  <h1>📌 Lighthouse Summary Report</h1>

  <div class="card">
    <h2>Management Summary</h2>
    <ul>${liSummary}</ul>

    <h2>Top Site-Wide Issues (by priority)</h2>
    ${renderBlock("High Priority", byPrio.high)}
    ${renderBlock("Medium Priority", byPrio.medium)}
    ${renderBlock("Low Priority", byPrio.low)}
    ${a11yNote}
  </div>

  <footer>Generated at ${escapeHtml(new Date().toLocaleString())}.</footer>
</body>
</html>`;
}

/* ============================
 * MAIN
 * ============================ */

/**
 * Entrypoint: reads inputs, optionally validates, normalizes data,
 * filters Accessibility (default off), synthesizes summary if needed,
 * renders HTML to an output file.
 */
(function main() {
  // Ensure output directory exists
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  } catch {
    /* no-op */
  }

  const summaryRaw = readJSON(SUMMARY_PATH, null);
  const issuesRaw = readJSON(SITE_PATH, null);

  if (DO_VALIDATE) {
    const sumRes = validateSummaryData(summaryRaw);
    const issRes = validateIssuesData(issuesRaw);
    const { errorCount, warningCount } = printValidationReport(sumRes, issRes);

    if (VALIDATE_ONLY) {
      // Stop here (useful in CI).
      if (errorCount > 0) process.exit(1);
      console.log(
        `Validation finished with ${errorCount} error(s) and ${warningCount} warning(s).`
      );
      return;
    }

    if (errorCount > 0) {
      console.error("❌ Validation failed. Fix the above errors and rerun.");
      process.exit(1);
    }
  }

  const summary =
    summaryRaw && typeof summaryRaw === "object"
      ? summaryRaw
      : { management_summary: [] };

  const site =
    issuesRaw && typeof issuesRaw === "object"
      ? issuesRaw
      : { common_issues: [] };

  let issues = (site.common_issues || []).map(normalizeIssue).filter(Boolean);

  // Accessibility filter (DEFAULT: exclude). We check 'area' or 'category' represented in 'area'.
  if (!INCLUDE_A11Y) {
    issues = issues.filter((it) => !/\baccessibility\b/i.test(it.area || ""));
  }

  const summaryPoints = (
    summary.management_summary &&
    Array.isArray(summary.management_summary) &&
    summary.management_summary.length
      ? summary.management_summary
      : synthesizeManagementSummary(issues, MAX_SUMMARY)
  ).filter(Boolean);

  const html = renderHTML(summaryPoints, issues, MAX_PER_PRIORITY);

  const fileName = `lighthouse-summary-report-${nowStamp()}.html`;
  const outPath = path.join(OUT_DIR, fileName);

  try {
    fs.writeFileSync(outPath, html);
    console.log(`✅ Summary-only report generated: ${outPath}`);
  } catch (err) {
    console.error(
      "❌ Failed to write report:",
      err && err.message ? err.message : err
    );
    process.exitCode = 1;
  }
})();
