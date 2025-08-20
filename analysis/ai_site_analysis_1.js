// ai_site_analysis.js
// Two-stage AI summarization for Lighthouse data + manual fallback.
// Requires: npm i openai
// Env: OPENAI_API_KEY must be set.

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

// Your existing local modules:
const { runAnalysis } = require("./analysis"); // writes per_url_prioritized.json + site_common_issues.json
const { readReports } = require("./helpers");

// -----------------------------
// PROMPTS
// -----------------------------
const AI_SYSTEM_PROMPT_JSON = `
You are a Senior Web Performance & Accessibility Auditor.
Given Lighthouse analysis data for multiple URLs, you will:
1. Identify common issues across the entire site.
2. Classify issues into categories (Performance, Accessibility, Best Practices, SEO).
3. Group issues by technical area (Images, CSS, JavaScript, Fonts, Network/Caching, Core Web Vitals, Accessibility, SEO).
4. Count how many URLs are affected by each issue and calculate priority:
   - High = affects many pages AND has high severity impact (score < 0.5).
   - Medium = affects multiple pages with moderate impact (score 0.5–0.89).
   - Low = affects few pages or is minor (score 0.9 but < 1).
5. Create:
   - Management Summary → short bullet points in plain language, focusing on business/UX impact.
   - Technical Summary → grouped by category and area, with affected URLs count, priority, and a plain-English fix suggestion.
6. Recommend quick wins (≤ 1 day effort) vs larger projects (> 1 day).
7. Provide output strictly in JSON:

{
  "management_summary": [
    "Plain language point 1",
    "Plain language point 2"
  ],
  "common_issues": [
    {
      "area": "images|css|javascript|fonts|network_caching|core_web_vitals|accessibility|seo",
      "issue_title": "Largest Contentful Paint too slow",
      "priority": "high|medium|low",
      "affected_urls": ["url1","url2"],
      "affected_count": 5,
      "why_it_matters": "Impact on engagement or compliance",
      "how_to_fix": ["Step 1","Step 2"],
      "effort": "quick_win|large_project"
    }
  ],
  "generated_at": "ISO timestamp",
  "version": "lh-site-analysis-v1"
}
`;

const AI_SYSTEM_PROMPT_HUMAN = `
You are a concise technical writer for executives and engineers.
Given the JSON produced by the Lighthouse Site Analysis step, generate a
human-readable report. Keep it practical, skimmable, and action-oriented.
If HTML is requested, return a complete <html> document with minimal CSS.
If Markdown is requested, return pure Markdown.
Include:
- A short "Management Summary" (chips or bullets).
- A "Top Common Issues" table: Area | Issue | Priority | #URLs | Why it matters | How to fix | Effort.
- A "Quick Wins vs Larger Projects" split.
- A small per-URL snapshot table (URL | Perf/A11y/BP/SEO | High/Med/Low counts) if provided.
`;

// -----------------------------
// HELPERS
// -----------------------------
function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeWrite(p, data) {
  fs.writeFileSync(
    p,
    typeof data === "string" ? data : JSON.stringify(data, null, 2)
  );
}

function buildAnalysisDataFromLocalOutputs({
  perUrlPath = "per_url_prioritized.json",
  siteCommonPath = "site_common_issues.json",
}) {
  const perUrl = loadJSON(perUrlPath); // map keyed by `${url}_${device}`
  const siteCommon = loadJSON(siteCommonPath); // { common_issues, generated_at, version }

  // Flatten per-URL for snapshots
  const perUrlArray = Object.values(perUrl).map((u) => ({
    url: u.url,
    device: u.device,
    metrics: u.metrics,
    issues_count: u.issues_count, // {by_category, by_priority, total}
  }));

  return {
    per_url: perUrl, // full detail
    per_url_snapshot: perUrlArray, // compact
    site_common_issues: siteCommon.common_issues,
    generated_at: new Date().toISOString(),
    version: "lh-agg-for-ai-v1",
  };
}

// Optional filter to drop a11y from the AI output (your earlier toggle)
function filterAccessibilityFromAIJson(aiJson) {
  if (!aiJson?.common_issues) return aiJson;
  aiJson.common_issues = aiJson.common_issues.filter(
    (i) => i.area !== "accessibility"
  );
  return aiJson;
}

// -----------------------------
// FN #1 — AI builds JSON summary (from .lighthouseci/*.json)
// -----------------------------
async function aiBuildSiteSummaryJSON({
  reportsDir = ".lighthouseci",
  includeAccessibility = false,
  out = "summary_report.json",
  openaiModel = "gpt-4.1-mini", // pick your model id
  timeoutMs = 120000,
} = {}) {
  // 1) Ensure latest local analysis (manual aggregator -> machine JSON inputs)
  //    This scans all .lighthouseci/lhr-*.json and writes per_url_prioritized.json + site_common_issues.json
  runAnalysis({ reportsDir, topPerCategory: 0 });

  // 2) Shape analysisData bundle for AI
  const analysisData = buildAnalysisDataFromLocalOutputs({});

  // 3) Call OpenAI with system + user payload
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: timeoutMs,
  });

  const completion = await client.chat.completions.create({
    model: openaiModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT_JSON },
      { role: "user", content: JSON.stringify({ analysisData }) },
    ],
  });

  let aiJson = {};
  try {
    aiJson = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    throw new Error("AI JSON parse failed: " + e.message);
  }

  // Optional: toggle to hide accessibility issues
  if (!includeAccessibility) aiJson = filterAccessibilityFromAIJson(aiJson);

  // 4) Persist
  safeWrite(out, aiJson);
  return aiJson;
}

// -----------------------------
// FN #2 — AI renders human report (HTML or Markdown) from AI JSON
// -----------------------------
async function aiRenderHumanReport({
  summaryJsonPath = "summary_report.json",
  format = "html", // "html" | "md"
  out = format === "html" ? "summary_report_ai.html" : "summary_report_ai.md",
  openaiModel = "gpt-4.1-mini",
  timeoutMs = 120000,
} = {}) {
  const summaryJson = loadJSON(summaryJsonPath);

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: timeoutMs,
  });
  const userAsk =
    format === "html"
      ? `Create a single self-contained HTML report (no external assets) using this JSON:\n\n${JSON.stringify(
          summaryJson
        )}`
      : `Create a concise Markdown report using this JSON:\n\n${JSON.stringify(
          summaryJson
        )}`;

  const completion = await client.chat.completions.create({
    model: openaiModel,
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT_HUMAN },
      { role: "user", content: userAsk },
    ],
  });

  const outText = completion.choices[0].message.content;
  safeWrite(out, outText);
  return outText;
}

// -----------------------------
// MCP/A2A integration glue (optional)
// -----------------------------
/**
 * Example MCP handler:
 *  - trigger: "site_lighthouse_audit"
 *  - payload: { reportsDir?: string, includeAccessibility?: boolean, humanFormat?: "html"|"md" }
 */
async function handleMCPEvent(event) {
  if (event?.type !== "site_lighthouse_audit") return { status: "ignored" };

  const {
    reportsDir = ".lighthouseci",
    includeAccessibility = false,
    humanFormat = "html",
  } = event.payload || {};

  // A2A step-1: AI JSON
  const json = await aiBuildSiteSummaryJSON({
    reportsDir,
    includeAccessibility,
  });
  // A2A step-2: Human-readable
  const human = await aiRenderHumanReport({
    summaryJsonPath: "summary_report.json",
    format: humanFormat,
  });

  return {
    status: "ok",
    files: [
      path.resolve("per_url_prioritized.json"),
      path.resolve("site_common_issues.json"),
      path.resolve("summary_report.json"),
      path.resolve(
        humanFormat === "html"
          ? "summary_report_ai.html"
          : "summary_report_ai.md"
      ),
    ],
    preview: human.slice(0, 4000), // snippet for logs
    counts: { common_issues: json?.common_issues?.length || 0 },
  };
}

// -----------------------------
// Manual (no-AI) fallback that costs ₹0 in API
//  - Uses your existing `analysis.js` outputs and renders a clean HTML.
// -----------------------------
function manualHumanSummary({
  reportsDir = ".lighthouseci",
  outJson = "summary_report.json",
  outHtml = "summary_report.html",
}) {
  // Produce machine rollups
  runAnalysis({ reportsDir, topPerCategory: 0 });

  // Build a compact, business-friendly JSON without AI
  const {
    per_url,
    per_url_snapshot,
    site_common_issues,
    generated_at,
    version,
  } = buildAnalysisDataFromLocalOutputs({});

  // Simple management bullets (no AI wording)
  const pages = per_url_snapshot.length;
  const avg = (k) =>
    Math.round(
      per_url_snapshot.reduce((a, p) => a + (p.metrics?.[k] || 0), 0) /
        Math.max(pages, 1)
    );
  const hiPages = per_url_snapshot.filter(
    (p) => (p.issues_count?.by_priority?.high || 0) > 0
  ).length;

  const top3 = site_common_issues.slice(0, 3).map((c) => c.issue_title);

  const summaryJson = {
    management_summary: [
      `Baseline: Perf ${avg("performance")}%, BP ${avg(
        "bestPractices"
      )}%, SEO ${avg("seo")}%`,
      `${hiPages}/${pages} pages have at least one HIGH-priority issue.`,
      `Top recurring issues: ${top3.join("; ")}.`,
    ],
    common_issues: site_common_issues.map((c) => ({
      ...c,
      why_it_matters:
        c.area === "core_web_vitals"
          ? "Directly impacts user-perceived speed and rankings."
          : c.area === "images"
          ? "Heavy/incorrect images slow loads and waste data."
          : c.area === "network_caching"
          ? "Weak caching forces repeat downloads for returning users."
          : c.area === "javascript"
          ? "Long tasks block interactivity; increases bounce."
          : c.area === "css"
          ? "Blocking/unused CSS delays first paint and LCP."
          : c.area === "fonts"
          ? "Slow fonts cause layout shifts and readability issues."
          : c.area === "accessibility"
          ? "Violations risk compliance and exclude users."
          : "Impacts user experience and efficiency.",
      effort: ["images", "network_caching", "fonts"].includes(c.area)
        ? "quick_win"
        : "large_project",
    })),
    generated_at,
    version: "lh-site-analysis-v1",
  };

  safeWrite(outJson, summaryJson);

  // Minimal readable HTML (no AI)
  const rows = summaryJson.common_issues
    .slice(0, 10)
    .map((c) => {
      const fix = Array.isArray(c.how_to_fix)
        ? c.how_to_fix.join("; ")
        : c.how_to_fix || "-";
      return `<tr>
      <td>${c.area}</td><td>${c.issue_title}</td><td>${c.priority}</td>
      <td>${c.affected_count}</td><td>${c.why_it_matters}</td><td>${fix}</td><td>${c.effort}</td>
    </tr>`;
    })
    .join("");

  const html = `<!doctype html><meta charset="utf-8"/>
  <title>Lighthouse Site Summary</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}
    h1,h2{margin:0 0 12px;}
    .chips span{display:inline-block;border:1px solid #ddd;border-radius:999px;padding:4px 10px;margin:4px 8px 0 0;font-size:12px}
    table{border-collapse:collapse;width:100%;margin-top:12px}
    th,td{border:1px solid #eee;padding:8px;vertical-align:top}
    th{background:#fafafa;text-align:left}
    .muted{color:#666}
  </style>
  <h1>Management Summary</h1>
  <div class="chips">
    ${summaryJson.management_summary.map((p) => `<span>${p}</span>`).join("")}
  </div>
  <h2>Top Common Issues</h2>
  <table>
    <thead><tr><th>Area</th><th>Issue</th><th>Priority</th><th># URLs</th><th>Why it matters</th><th>How to fix</th><th>Effort</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2 class="muted">Generated ${new Date().toLocaleString()}</h2>`;
  safeWrite(outHtml, html);

  return { outJson, outHtml };
}

// -----------------------------
// CLI (optional)
// node ai_site_analysis.js ai-json        # builds AI JSON
// node ai_site_analysis.js ai-human html  # builds AI HTML
// node ai_site_analysis.js manual         # builds manual JSON+HTML (no AI)
// -----------------------------
if (require.main === module) {
  (async () => {
    const mode = process.argv[2] || "manual";
    if (mode === "ai-json") {
      await aiBuildSiteSummaryJSON({});
      console.log("✅ Wrote summary_report.json (AI).");
    } else if (mode === "ai-human") {
      const format = (process.argv[3] || "html").toLowerCase();
      await aiRenderHumanReport({ format });
      console.log(
        `✅ Wrote ${
          format === "html" ? "summary_report_ai.html" : "summary_report_ai.md"
        } (AI).`
      );
    } else {
      const { outJson, outHtml } = manualHumanSummary({});
      console.log(`✅ Wrote ${outJson} and ${outHtml} (manual, no AI).`);
    }
  })().catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  });
}

module.exports = {
  aiBuildSiteSummaryJSON,
  aiRenderHumanReport,
  handleMCPEvent,
  manualHumanSummary,
};
