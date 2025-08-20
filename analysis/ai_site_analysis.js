// analysis/ai_site_analysis.js
// Fast AI summarization using pre-aggregated rollups only.
// Inputs:  per_url_prioritized.json  +  site_common_issues.json
// Outputs: summary_report.json (AI JSON), summary_report_final.html (human), ai_status.json
//
// Env:
//   OPENAI_API_KEY   (required for AI mode; manual fallback if missing or fails)
//   OPENAI_MODEL     (optional; else auto-choose)
//   INCLUDE_A11Y=1   (optional; include accessibility issues)
//
// npm scripts (suggested):
//   "analysis:human": "node analysis/ai_site_analysis.js"         (AI → fallback)
//   "analysis:human:manual": "node analysis/ai_site_analysis.js manual" (manual only)

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

// ---------- Small utils ----------
function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}
function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function safeWrite(p, data) {
  fs.writeFileSync(
    p,
    typeof data === "string" ? data : JSON.stringify(data, null, 2)
  );
}
function nowIso() {
  return new Date().toISOString();
}

// ---------- Auto model chooser ----------
const PREFERRED_MODELS = [
  process.env.OPENAI_MODEL, // allow override from CI
  "gpt-4o-mini",
  "gpt-4.1-mini",
  "gpt-4o",
].filter(Boolean);

async function chooseWorkingModel(client) {
  for (const m of PREFERRED_MODELS) {
    try {
      await client.chat.completions.create({
        model: m,
        max_tokens: 5,
        messages: [{ role: "user", content: "ok" }],
      });
      return m;
    } catch (_) {
      /* try next */
    }
  }
  throw new Error("No usable OpenAI model from PREFERRED_MODELS.");
}

// ---------- Build compact payload from rollups ----------
function buildAnalysisDataFromRollups({
  perUrlPath = "per_url_prioritized.json",
  siteCommonPath = "site_common_issues.json",
  caps = { maxUrls: 150, maxIssues: 80, maxAffectedUrlsPerIssue: 15 },
} = {}) {
  if (!exists(perUrlPath) || !exists(siteCommonPath)) {
    throw new Error(
      `Missing rollups. Expected ${perUrlPath} and ${siteCommonPath}. Run "npm run analysis" first.`
    );
  }

  const perUrl = loadJSON(perUrlPath);
  const siteCommon = loadJSON(siteCommonPath);

  const per_url_snapshot = Object.values(perUrl)
    .slice(0, caps.maxUrls)
    .map((u) => ({
      url: u.url,
      device: u.device,
      metrics: u.metrics,
      issues_count: u.issues_count,
    }));

  const site_common_issues = (siteCommon.common_issues || [])
    .slice(0, caps.maxIssues)
    .map((c) => ({
      area: c.area,
      issue_title: c.issue_title,
      audit_id: c.audit_id,
      priority: c.priority,
      affected_urls: (c.affected_urls || []).slice(
        0,
        caps.maxAffectedUrlsPerIssue
      ),
      affected_count: Math.min(
        c.affected_count || 0,
        caps.maxAffectedUrlsPerIssue
      ),
      how_to_fix: Array.isArray(c.how_to_fix)
        ? c.how_to_fix.slice(0, 3)
        : c.how_to_fix || [],
    }));

  return {
    per_url_snapshot,
    site_common_issues,
    generated_at: nowIso(),
    version: "lh-agg-for-ai-v2",
  };
}

// ---------- Prompts ----------
const AI_SYSTEM_PROMPT_JSON = `
You are a Senior Web Performance & Accessibility Auditor.
Given Lighthouse rollups for multiple URLs, produce a site-level summary in STRICT JSON:

- Provide "management_summary": 3–10 short or medium, business-focused bullets (no jargon). Be explanatory and concrete, but concise.
- Provide "common_issues": a list of issues with fields:
  area (images|css|javascript|fonts|network_caching|core_web_vitals|accessibility|seo),
  issue_title, priority (high|medium|low), affected_urls (array), affected_count (int),
  why_it_matters (plain English), how_to_fix (<=3 steps), effort (quick_win|large_project), ref_url (first affected URL).
- Always return at least 5 items in "common_issues" when available.
- If unsure, copy from provided site_common_issues and fill the missing fields (why_it_matters, effort, ref_url).
- Keep responses concise and action-oriented.

Return JSON only.
`;


// ---------- A11y filter (safe) ----------
function maybeFilterA11y(aiJson, includeA11y) {
  if (includeA11y || !aiJson?.common_issues) return aiJson;
  const kept = aiJson.common_issues.filter((i) => i.area !== "accessibility");
  aiJson.common_issues = kept.length ? kept : aiJson.common_issues; // don't wipe list to empty
  return aiJson;
}

// ---------- Backfill if AI skimps ----------
function backfillFromManual(aiJson, rollup) {
  // Ensure list exists
  if (
    !Array.isArray(aiJson.common_issues) ||
    aiJson.common_issues.length === 0
  ) {
    aiJson.common_issues = (rollup.site_common_issues || [])
      .slice(0, 20)
      .map((c) => ({
        area: c.area,
        issue_title: c.issue_title,
        priority: c.priority,
        affected_urls: c.affected_urls || [],
        affected_count:
          c.affected_count || (c.affected_urls ? c.affected_urls.length : 0),
        why_it_matters: "Impacts user experience and/or compliance.",
        how_to_fix: Array.isArray(c.how_to_fix)
          ? c.how_to_fix.slice(0, 3)
          : c.how_to_fix || [],
        effort: ["images", "fonts", "network_caching"].includes(c.area)
          ? "quick_win"
          : "large_project",
        ref_url: (c.affected_urls && c.affected_urls[0]) || null,
      }));
  } else {
    // Normalize/complete each item
    aiJson.common_issues = aiJson.common_issues.map((c) => ({
      area: c.area,
      issue_title: c.issue_title,
      priority: c.priority || "medium",
      affected_urls: Array.isArray(c.affected_urls) ? c.affected_urls : [],
      affected_count: Number.isFinite(c.affected_count)
        ? c.affected_count
        : Array.isArray(c.affected_urls)
        ? c.affected_urls.length
        : 0,
      why_it_matters:
        c.why_it_matters || "Impacts user experience and/or compliance.",
      how_to_fix: Array.isArray(c.how_to_fix)
        ? c.how_to_fix.slice(0, 3)
        : c.how_to_fix
        ? [String(c.how_to_fix)]
        : [],
      effort:
        c.effort ||
        (["images", "fonts", "network_caching"].includes(c.area)
          ? "quick_win"
          : "large_project"),
      ref_url:
        c.ref_url ||
        (Array.isArray(c.affected_urls) && c.affected_urls[0]) ||
        null,
    }));
  }

  if (
    !Array.isArray(aiJson.management_summary) ||
    aiJson.management_summary.length === 0
  ) {
    const pages = rollup.per_url_snapshot.length || 1;
    const avg = (k) =>
      Math.round(
        rollup.per_url_snapshot.reduce((a, p) => a + (p.metrics?.[k] || 0), 0) /
          pages
      );
    aiJson.management_summary = [
      `Baseline (avg): Perf ${avg("performance")}%, BP ${avg(
        "bestPractices"
      )}%, SEO ${avg("seo")}%`,
      `Top recurring issues include ${rollup.site_common_issues
        .slice(0, 3)
        .map((x) => x.issue_title)
        .join(", ")}.`,
      `${pages} page snapshots analyzed across devices.`,
    ];
  }

  aiJson.generated_at = aiJson.generated_at || nowIso();
  aiJson.version = aiJson.version || "lh-site-analysis-v1";
  return aiJson;
}

// ---------- Render human HTML locally (architect-style) ----------
function renderHumanHtml(summaryJson) {
  const chips = (summaryJson.management_summary || [])
    .map((p) => `<span>${p}</span>`)
    .join(" ");
  const rows = (summaryJson.common_issues || [])
    .map((c) => {
      const fix = Array.isArray(c.how_to_fix)
        ? c.how_to_fix.join("; ")
        : c.how_to_fix || "-";
      const ref = c.ref_url
        ? `<a href="${c.ref_url}" target="_blank" rel="noopener">link</a>`
        : "-";
      return `<tr>
      <td>${c.area}</td>
      <td>${c.issue_title}</td>
      <td class="prio ${c.priority}">${c.priority}</td>
      <td class="count">${c.affected_count}</td>
      <td>${c.why_it_matters}</td>
      <td>${fix}</td>
      <td>${c.effort}</td>
      <td>${ref}</td>
    </tr>`;
    })
    .join("");

  const hasIssues = (summaryJson.common_issues || []).length > 0;
  const badgeText = "AI ✓";
  const badgeColor = "#0a7d32";

  return `<!doctype html><meta charset="utf-8"/>
  <title>Lighthouse Site Summary (AI)</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;color:#111}
    .badge{position:sticky;top:0;z-index:9;background:${badgeColor};color:#fff;padding:8px 12px;margin:-24px -24px 16px -24px}
    h1{margin:8px 0 12px}
    .chips span{display:inline-block;border:1px solid #e5e7eb;border-radius:999px;padding:6px 12px;margin:6px 8px 0 0;font-size:12px;background:#fafafa}
    table{border-collapse:collapse;width:100%;margin-top:16px}
    th,td{border:1px solid #eee;padding:8px;vertical-align:top;font-size:14px}
    th{background:#f9fafb;text-align:left}
    td.prio.high{color:#b91c1c;font-weight:600}
    td.prio.medium{color:#b45309;font-weight:600}
    td.prio.low{color:#2563eb;font-weight:600}
    td.count{text-align:right}
    .muted{color:#6b7280;font-size:12px;margin-top:16px}
  </style>
  <div class="badge"><strong>${badgeText}</strong> · ${new Date().toLocaleString()}</div>
  <h1>Management Summary</h1>
  <div class="chips">${chips}</div>

  <h2 style="margin-top:20px">Top Common Issues</h2>
  <table>
    <thead><tr>
      <th>Area</th><th>Issue</th><th>Priority</th><th># URLs</th>
      <th>Why it matters</th><th>How to fix</th><th>Effort</th><th>Ref URL</th>
    </tr></thead>
    <tbody>
      ${hasIssues ? rows : `<tr><td colspan="8">No issues found.</td></tr>`}
    </tbody>
  </table>

  <div class="muted">Generated ${new Date().toLocaleString()}</div>`;
}

// ---------- AI JSON builder (from rollups only) ----------
async function aiBuildSiteSummaryJSON({
  includeAccessibility = String(
    process.env.INCLUDE_A11Y || ""
  ).toLowerCase() === "1",
  out = "summary_report.json",
  timeoutMs = 300000,
  perUrlPath = "per_url_prioritized.json",
  siteCommonPath = "site_common_issues.json",
  openaiModel = "auto",
} = {}) {
  const rollup = buildAnalysisDataFromRollups({ perUrlPath, siteCommonPath });

  const payload = JSON.stringify({ analysisData: rollup });
  console.log("AI payload size ~", (payload.length / 1e6).toFixed(2), "MB");

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: timeoutMs,
  });
  const modelToUse =
    openaiModel === "auto" ? await chooseWorkingModel(client) : openaiModel;

  const tryOnce = async () => {
    const completion = await client.chat.completions.create({
      model: modelToUse,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT_JSON },
        { role: "user", content: payload },
      ],
    });
    return JSON.parse(completion.choices[0].message.content);
  };

  let aiJson;
  try {
    aiJson = await tryOnce();
  } catch (e) {
    console.warn("AI call failed once, retrying in 1500ms:", e.message);
    await new Promise((r) => setTimeout(r, 1500));
    aiJson = await tryOnce();
  }

  // A11y visibility + backfill
  aiJson = maybeFilterA11y(aiJson, includeAccessibility);
  aiJson = backfillFromManual(aiJson, rollup);

  safeWrite(out, aiJson);
  return aiJson;
}

// ---------- Manual JSON (no AI), same shape ----------
function manualSummaryJSON({
  perUrlPath = "per_url_prioritized.json",
  siteCommonPath = "site_common_issues.json",
  outJson = "summary_report.json",
}) {
  const rollup = buildAnalysisDataFromRollups({ perUrlPath, siteCommonPath });
  const pages = rollup.per_url_snapshot.length || 1;
  const avg = (k) =>
    Math.round(
      rollup.per_url_snapshot.reduce((a, p) => a + (p.metrics?.[k] || 0), 0) /
        pages
    );

  const summaryJson = {
    management_summary: [
      `Baseline (avg): Perf ${avg("performance")}%, BP ${avg(
        "bestPractices"
      )}%, SEO ${avg("seo")}%`,
      `${pages} page snapshots analyzed across devices.`,
      `Top recurring issues: ${rollup.site_common_issues
        .slice(0, 3)
        .map((x) => x.issue_title)
        .join("; ")}.`,
    ],
    common_issues: rollup.site_common_issues.map((c) => ({
      area: c.area,
      issue_title: c.issue_title,
      priority: c.priority,
      affected_urls: c.affected_urls || [],
      affected_count:
        c.affected_count || (c.affected_urls ? c.affected_urls.length : 0),
      why_it_matters:
        c.area === "core_web_vitals"
          ? "Direct impact on perceived speed and rankings."
          : c.area === "images"
          ? "Heavy/unoptimized images slow loads and waste data."
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
      how_to_fix: Array.isArray(c.how_to_fix)
        ? c.how_to_fix.slice(0, 3)
        : c.how_to_fix || [],
      effort: ["images", "fonts", "network_caching"].includes(c.area)
        ? "quick_win"
        : "large_project",
      ref_url: (c.affected_urls && c.affected_urls[0]) || null,
    })),
    generated_at: rollup.generated_at,
    version: "lh-site-analysis-v1",
  };

  safeWrite(outJson, summaryJson);
  return summaryJson;
}

// ---------- Human report pipeline (AI → fallback) ----------
async function generateHumanReport({
  includeAccessibility = String(
    process.env.INCLUDE_A11Y || ""
  ).toLowerCase() === "1",
  outJson = "summary_report.json",
  outHtml = "summary_report_final.html",
} = {}) {
  let mode = "ai";
  let json;
  try {
    json = await aiBuildSiteSummaryJSON({ includeAccessibility, out: outJson });
  } catch (e) {
    console.warn("AI failed:", e.message, "→ using manual summary.");
    mode = "manual";
    json = manualSummaryJSON({ outJson });
  }

  const html = renderHumanHtml(json);
  safeWrite(outHtml, html);

  safeWrite("ai_status.json", {
    ok: mode === "ai",
    mode,
    generated_at: nowIso(),
    files: [path.resolve(outJson), path.resolve(outHtml)],
  });

  console.log(`✅ ${mode === "ai" ? "AI" : "Manual"} report ready: ${outHtml}`);
  return { mode, outJson, outHtml };
}

// ---------- CLI ----------
// node analysis/ai_site_analysis.js          → AI → fallback (writes summary_report.json + summary_report_final.html)
// node analysis/ai_site_analysis.js manual   → manual only
if (require.main === module) {
  (async () => {
    const mode = (process.argv[2] || "auto").toLowerCase();
    if (mode === "manual") {
      const json = manualSummaryJSON({});
      const html = renderHumanHtml(json);
      safeWrite("summary_report_final.html", html);
      safeWrite("ai_status.json", {
        ok: false,
        mode: "manual",
        generated_at: nowIso(),
      });
      console.log("✅ Manual report ready: summary_report_final.html");
      return;
    }
    await generateHumanReport({});
  })().catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  });
}

// Exports (in case you want to call from another script)
module.exports = {
  aiBuildSiteSummaryJSON,
  manualSummaryJSON,
  renderHumanHtml,
  generateHumanReport,
};
