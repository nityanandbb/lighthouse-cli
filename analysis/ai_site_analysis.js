// analysis/ai_site_analysis.js
// Human-readable site summary via AI, with manual fallback + status signal.
// Requires: npm i openai
// Env: OPENAI_API_KEY must be set for AI path.
// Optional env: INCLUDE_A11Y=1 to include Accessibility issues in AI JSON.

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

// Local modules
const { runAnalysis } = require("./analysis");
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
Return a complete <html> document with minimal CSS, no external assets.
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

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function buildAnalysisDataFromLocalOutputs({
  perUrlPath = "per_url_prioritized.json",
  siteCommonPath = "site_common_issues.json",
}) {
  const perUrl = loadJSON(perUrlPath); // map keyed by `${url}_${device}`
  const siteCommon = loadJSON(siteCommonPath); // { common_issues, generated_at, version }

  const perUrlArray = Object.values(perUrl).map((u) => ({
    url: u.url,
    device: u.device,
    metrics: u.metrics,
    issues_count: u.issues_count, // {by_category, by_priority, total}
  }));

  return {
    per_url: perUrl,
    per_url_snapshot: perUrlArray,
    site_common_issues: siteCommon.common_issues,
    generated_at: new Date().toISOString(),
    version: "lh-agg-for-ai-v1",
  };
}

function filterAccessibilityFromAIJson(aiJson) {
  if (!aiJson?.common_issues) return aiJson;
  aiJson.common_issues = aiJson.common_issues.filter(
    (i) => i.area !== "accessibility"
  );
  return aiJson;
}

function writeStatus(status) {
  const out = {
    ok: !!status.ok,
    mode: status.mode, // "ai" | "manual"
    reason: status.reason || null, // error or "ok"
    generated_at: new Date().toISOString(),
    files: status.files || [],
  };
  safeWrite("ai_status.json", out);
}

function injectStatusBadgeIntoHtml(html, { ok, mode }) {
  const badgeText = ok && mode === "ai" ? "AI ✓" : "Fallback: Manual";
  const badgeColor = ok && mode === "ai" ? "#0a7d32" : "#915400";
  const bar = `
  <div style="position:sticky;top:0;z-index:9999;background:${badgeColor};
      color:#fff;padding:8px 12px;font:13px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
    <strong>${badgeText}</strong>
    <span style="opacity:.8;margin-left:8px">Report generated ${
      ok && mode === "ai" ? "via AI" : "by manual fallback"
    } · ${new Date().toLocaleString()}</span>
  </div>`;
  // Insert right after <body> (or at top)
  if (html.includes("<body")) {
    return html.replace(/<body[^>]*>/i, (m) => `${m}\n${bar}\n`);
  }
  return `${bar}\n${html}`;
}

// -----------------------------
// AI JSON builder
// -----------------------------
async function aiBuildSiteSummaryJSON({
  reportsDir = ".lighthouseci",
  includeAccessibility = false,
  out = "summary_report.json",
  openaiModel = "gpt-4.1-mini",
  timeoutMs = 120000,
} = {}) {
  runAnalysis({ reportsDir, topPerCategory: 0 });

  const analysisData = buildAnalysisDataFromLocalOutputs({});

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

  // Validate minimal shape
  if (!aiJson.management_summary || !Array.isArray(aiJson.management_summary)) {
    throw new Error("AI JSON missing management_summary");
  }
  if (!aiJson.common_issues || !Array.isArray(aiJson.common_issues)) {
    throw new Error("AI JSON missing common_issues");
  }

  if (!includeAccessibility) aiJson = filterAccessibilityFromAIJson(aiJson);

  safeWrite(out, aiJson);
  return aiJson;
}

// -----------------------------
// AI → Human HTML
// -----------------------------
async function aiRenderHumanReport({
  summaryJsonPath = "summary_report.json",
  out = "summary_report_ai.html",
  openaiModel = "gpt-4.1-mini",
  timeoutMs = 120000,
} = {}) {
  const summaryJson = loadJSON(summaryJsonPath);
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: timeoutMs,
  });

  const completion = await client.chat.completions.create({
    model: openaiModel,
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT_HUMAN },
      {
        role: "user",
        content:
          "Create a single self-contained HTML report (no external assets) using this JSON:\n\n" +
          JSON.stringify(summaryJson),
      },
    ],
  });

  const html = completion.choices[0].message.content;
  if (!html || !html.toLowerCase().includes("<html")) {
    throw new Error("AI HTML response was not a full <html> document");
  }
  safeWrite(out, html);
  return html;
}

// -----------------------------
// Manual fallback (no AI)
// -----------------------------
function manualHumanSummary({
  reportsDir = ".lighthouseci",
  outJson = "summary_report.json",
  outHtml = "summary_report.html",
}) {
  runAnalysis({ reportsDir, topPerCategory: 0 });

  const {
    per_url,
    per_url_snapshot,
    site_common_issues,
    generated_at,
    version,
  } = buildAnalysisDataFromLocalOutputs({});

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
// One-shot: produce ONLY human-readable output with status
// - Tries AI first, injects AI badge, writes summary_report_final.html
// - If AI fails, writes manual HTML with fallback badge
// -----------------------------
async function generateHumanReportOnly({
  reportsDir = ".lighthouseci",
  includeAccessibility = false,
  openaiModel = "gpt-4.1-mini",
  timeoutMs = 120000,
  finalOut = "summary_report_final.html",
} = {}) {
  // Always (re)build the base rollups (also filters out flags-*.json via helpers)
  runAnalysis({ reportsDir, topPerCategory: 0 });

  const wantA11y =
    includeAccessibility ||
    String(process.env.INCLUDE_A11Y || "").toLowerCase() === "1";

  // Try AI path
  if (process.env.OPENAI_API_KEY) {
    try {
      await aiBuildSiteSummaryJSON({
        reportsDir,
        includeAccessibility: wantA11y,
        openaiModel,
        timeoutMs,
      });
      const aiHtml = await aiRenderHumanReport({
        summaryJsonPath: "summary_report.json",
        out: "summary_report_ai.html",
        openaiModel,
        timeoutMs,
      });

      const withBadge = injectStatusBadgeIntoHtml(aiHtml, {
        ok: true,
        mode: "ai",
      });
      safeWrite(finalOut, withBadge);
      writeStatus({
        ok: true,
        mode: "ai",
        reason: "ok",
        files: [
          path.resolve("per_url_prioritized.json"),
          path.resolve("site_common_issues.json"),
          path.resolve("summary_report.json"),
          path.resolve("summary_report_ai.html"),
          path.resolve(finalOut),
        ],
      });
      console.log("✅ AI report ready:", finalOut);
      return;
    } catch (err) {
      console.error(
        "⚠️ AI generation failed, falling back to manual:",
        err.message
      );
    }
  } else {
    console.warn("ℹ️ OPENAI_API_KEY not set — using manual fallback.");
  }

  // Manual fallback
  const { outHtml } = manualHumanSummary({});
  const manualHtml = fs.readFileSync(outHtml, "utf8");
  const withBadge = injectStatusBadgeIntoHtml(manualHtml, {
    ok: false,
    mode: "manual",
  });
  safeWrite(finalOut, withBadge);
  writeStatus({
    ok: false,
    mode: "manual",
    reason: process.env.OPENAI_API_KEY ? "ai_failed" : "no_api_key",
    files: [
      path.resolve("per_url_prioritized.json"),
      path.resolve("site_common_issues.json"),
      path.resolve("summary_report.json"),
      path.resolve(outHtml),
      path.resolve(finalOut),
    ],
  });
  console.log("✅ Manual report ready:", finalOut);
}

// -----------------------------
// CLI
// node analysis/ai_site_analysis.js            # generate final HTML (AI or manual)
// node analysis/ai_site_analysis.js manual     # force manual only
// node analysis/ai_site_analysis.js ai         # force AI (throws if fails)
// -----------------------------
if (require.main === module) {
  (async () => {
    const mode = (process.argv[2] || "auto").toLowerCase();

    if (mode === "manual") {
      const { outHtml } = manualHumanSummary({});
      const manualHtml = fs.readFileSync(outHtml, "utf8");
      const withBadge = injectStatusBadgeIntoHtml(manualHtml, {
        ok: false,
        mode: "manual",
      });
      safeWrite("summary_report_final.html", withBadge);
      writeStatus({
        ok: false,
        mode: "manual",
        reason: "forced_manual",
        files: [
          path.resolve("per_url_prioritized.json"),
          path.resolve("site_common_issues.json"),
          path.resolve("summary_report.json"),
          path.resolve(outHtml),
          path.resolve("summary_report_final.html"),
        ],
      });
      console.log("✅ Manual report ready: summary_report_final.html");
      return;
    }

    if (mode === "ai") {
      if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY is not set.");
        process.exit(2);
      }
      // Try AI only, error if it fails
      await aiBuildSiteSummaryJSON({
        includeAccessibility:
          String(process.env.INCLUDE_A11Y || "").toLowerCase() === "1",
      });
      const aiHtml = await aiRenderHumanReport({
        out: "summary_report_ai.html",
      });
      const withBadge = injectStatusBadgeIntoHtml(aiHtml, {
        ok: true,
        mode: "ai",
      });
      safeWrite("summary_report_final.html", withBadge);
      writeStatus({
        ok: true,
        mode: "ai",
        reason: "ok",
        files: [
          path.resolve("per_url_prioritized.json"),
          path.resolve("site_common_issues.json"),
          path.resolve("summary_report.json"),
          path.resolve("summary_report_ai.html"),
          path.resolve("summary_report_final.html"),
        ],
      });
      console.log("✅ AI report ready: summary_report_final.html");
      return;
    }

    // auto (AI → fallback)
    await generateHumanReportOnly({});
  })().catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  });
}

module.exports = {
  generateHumanReportOnly,
};
