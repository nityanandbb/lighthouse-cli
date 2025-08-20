// ./components/generate_Pdf_Report_From_Data_v12NA.js
const fs = require("fs");
const puppeteer = require("puppeteer");

const getPercentage = (score) => {
  if (score >= 0 && score <= 1) return (score * 100).toFixed(0) + "%";
  else if (score > 1 && score <= 100) return score.toFixed(0) + "%";
  return "N/A";
};

const getPassFailColor = (score) => {
  if (score >= 0.9) return "green";
  if (score < 0.9) return "red";
  return "gray";
};

const getPerformancePercentageHtml_Desktop = (score) => {
  if (score >= 0.9) return "#006400"; // Dark Green
  if (score < 0.9) return "red";
  return "black";
};

const getPerformancePercentageHtml_Mobile = (score) => {
  if (score >= 0.8) return "#006400"; // Dark Green
  if (score < 0.8) return "red";
  return "black";
};

const getColoredPercentage = (score) => {
  const val = parseFloat(score);
  const percent = getPercentage(val);
  let color = "black";
  if (val >= 0.9) color = "green";
  else if (val >= 0.5) color = "orange";
  else color = "red";
  return `<span style="color: ${color}; font-weight: bold;">${percent}</span>`;
};

const groupByUrlAndDevice = (summaryData) => {
  const grouped = {};
  for (const entry of summaryData) {
    if (!grouped[entry.url]) grouped[entry.url] = {};
    grouped[entry.url][entry.runType.toLowerCase()] = entry;
  }
  return grouped;
};

const calculateAvg = (data, type, category) => {
  const items = data.filter((d) => d.runType.toLowerCase() === type);
  const valid = items
    .map((d) => d.categories?.[category])
    .filter((n) => typeof n === "number");
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
};

// ----- NEW: Safe readers for optional analysis JSONs -----
function readJsonIfExists(paths) {
  const list = Array.isArray(paths) ? paths : [paths];
  for (const p of list) {
    try {
      if (fs.existsSync(p)) {
        const txt = fs.readFileSync(p, "utf8");
        return JSON.parse(txt);
      }
    } catch (_) {}
  }
  return null;
}

function renderMetricsExplainerBlock() {
  return `
    <div class="info-box">
      <strong>About these metrics:</strong>
      <div><b>LCP (Largest Contentful Paint)</b>: Loading speed of the main content (lower is better).</div>
      <div><b>FCP (First Contentful Paint)</b>: Time until the first text or image appears (lower is better).</div>
      <div><b>TBT (Total Blocking Time)</b>: Main-thread blocking that delays interactivity (lower is better).</div>
      <div><b>CLS (Cumulative Layout Shift)</b>: Visual stability—unexpected shifting of elements (lower is better).</div>
      <div><b>SI (Speed Index)</b>: How quickly the page visually populates during load (lower is better).</div>
    </div>
  `;
}

// Renders the “Site-wide Common Issues (Summary)” section.
// Prefers summary_report.json (management_summary + common_issues in the user’s AI schema).
// Falls back to site_common_issues.json (from analysis.js) if the former is not present.
function renderSiteCommonIssuesSection() {
  const summary = readJsonIfExists([
    "summary_report.json",
    "./summary_report.json",
    "reports/summary_report.json",
    "./reports/summary_report.json",
  ]);

  const fallback = readJsonIfExists([
    "site_common_issues.json",
    "./site_common_issues.json",
    "reports/site_common_issues.json",
    "./reports/site_common_issues.json",
  ]);

  const generatedAt =
    summary?.generated_at || fallback?.generated_at || new Date().toISOString();
  const version =
    summary?.version || fallback?.version || "lh-site-analysis-v1";
  const managementSummary = Array.isArray(summary?.management_summary)
    ? summary.management_summary
    : [];

  const issues = Array.isArray(summary?.common_issues)
    ? summary.common_issues
    : Array.isArray(fallback?.common_issues)
    ? fallback.common_issues
    : [];

  // Normalize rows for table
  const rows = issues.map((it) => {
    const why = it.why_it_matters || ""; // optional in AI JSON
    const how = Array.isArray(it.how_to_fix)
      ? it.how_to_fix.join("; ")
      : it.how_to_fix || "";
    const effort = it.effort || ""; // optional in AI JSON
    const refUrl =
      Array.isArray(it.affected_urls) && it.affected_urls.length
        ? it.affected_urls[0]
        : "";
    return `
      <tr>
        <td>${escapeHtml(it.area || "")}</td>
        <td>${escapeHtml(it.issue_title || "")}</td>
        <td style="text-transform:capitalize">${escapeHtml(
          it.priority || ""
        )}</td>
        <td>${Number(it.affected_count || it.affected_urls?.length || 0)}</td>
        <td>${escapeHtml(why)}</td>
        <td>${escapeHtml(how)}</td>
        <td>${escapeHtml(effort)}</td>
        <td style="word-break:break-all">${escapeHtml(refUrl)}</td>
      </tr>
    `;
  });

  const mgmtList =
    managementSummary.length > 0
      ? `<ul class="bulleted">${managementSummary
          .map((p) => `<li>${escapeHtml(p)}</li>`)
          .join("")}</ul>`
      : `<div style="opacity:.7">No management summary available.</div>`;

  return `
    <h3>Site-wide Common Issues (Summary)</h3>
    <div class="note-line">Lighthouse Site Analysis Report<br/>
      <span class="muted">Generated: ${escapeHtml(
        generatedAt
      )} • Version: ${escapeHtml(version)}</span>
    </div>

    <div class="sub-title">Management Summary</div>
    ${mgmtList}

    <div class="sub-title" style="margin-top:12px;">Top Common Issues</div>
    <table>
      <thead>
        <tr>
          <th>Area</th>
          <th>Issue</th>
          <th>Priority</th>
          <th># URLs</th>
          <th>Why it matters</th>
          <th>How to fix</th>
          <th>Effort</th>
          <th>Ref URL</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("") || `<tr><td colspan="8">No issues found.</td></tr>`}
      </tbody>
    </table>
  `;
}

// Renders the “Issues by URL” static rollup for PDF.
// Reads per_url_prioritized.json from analysis.js (if available).
function renderIssuesByUrlSection() {
  const perUrl = readJsonIfExists([
    "per_url_prioritized.json",
    "./per_url_prioritized.json",
    "reports/per_url_prioritized.json",
    "./reports/per_url_prioritized.json",
  ]);

  if (!perUrl || typeof perUrl !== "object")
    return `
      <h3>Issues by URL</h3>
      <div class="muted">No detailed per-URL analysis available.</div>
    `;

  // Flatten & group by URL with device ordering: desktop first, then mobile
  const entries = Object.values(perUrl)
    .filter((e) => e && e.url && e.device)
    .sort((a, b) => {
      if (a.url === b.url) {
        if (a.device === b.device) return 0;
        // desktop first
        return a.device === "desktop" ? -1 : 1;
      }
      return a.url.localeCompare(b.url);
    });

  // Render a compact, readable block per (URL, device)
  const blocks = entries.map((e) => {
    const m = e.metrics || {};
    const perf = isFinite(m.performance)
      ? (m.performance / 100).toFixed(2)
      : "—";
    const a11y = isFinite(m.accessibility)
      ? (m.accessibility / 100).toFixed(2)
      : "—";
    const bp = isFinite(m.bestPractices)
      ? (m.bestPractices / 100).toFixed(2)
      : "—";
    const seo = isFinite(m.seo) ? (m.seo / 100).toFixed(2) : "—";

    const lcp = valOrDash(m.lcp);
    const fcp = valOrDash(m.fcp);
    const cls = valOrDash(m.cls);
    const tbt = valOrDash(m.tbt);

    const byCat = e.issues_count?.by_category || {
      performance: e.issues?.performance?.length || 0,
      accessibility: e.issues?.accessibility?.length || 0,
      bestPractices: e.issues?.bestPractices?.length || 0,
      seo: e.issues?.seo?.length || 0,
    };

    return `
      <div class="url-block">
        <div class="url-title">${escapeHtml(e.url)}</div>
        <div class="muted">Device: ${escapeHtml(
          e.device
        )} • Analyzed: ${escapeHtml(e.analysisDate || "")}</div>

        <table>
          <thead>
            <tr>
              <th>Perf</th><th>A11y</th><th>BP</th><th>SEO</th>
              <th>LCP</th><th>FCP</th><th>CLS</th><th>TBT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${perf}</td><td>${a11y}</td><td>${bp}</td><td>${seo}</td>
              <td>${lcp}</td><td>${fcp}</td><td>${cls}</td><td>${tbt}</td>
            </tr>
          </tbody>
        </table>

        <div class="pill-row">
          <span class="pill">Performance Issues (${
            byCat.performance || 0
          })</span>
          <span class="pill">Accessibility Issues (${
            byCat.accessibility || 0
          })</span>
          <span class="pill">Best Practices Issues (${
            byCat.bestPractices || 0
          })</span>
          <span class="pill">SEO Issues (${byCat.seo || 0})</span>
        </div>
      </div>
    `;
  });

  return `
    <h3>Issues by URL</h3>
    <div class="muted">Detailed Lighthouse-style analysis with Performance, Accessibility, Best Practices, and SEO issues per URL.</div>
    ${blocks.join("")}
  `;
}

function valOrDash(v) {
  if (v === 0) return "0";
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const generatePdfReportFromData = async (logo, summaryData, configData) => {
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-").replace(/\..+/, "");
  const filename = `lighthouse-metrics-report-${dateString}.pdf`;

  const grouped = groupByUrlAndDevice(summaryData);

  const getRows = () => {
    return Object.entries(grouped)
      .map(([url, types]) => {
        let html = "";
        if (types.desktop) {
          const d = types.desktop;
          html += `<tr><td><strong>Desktop</strong></td><td style="word-wrap: break-word; max-width: 300px;">${url}</td><td><span style="color: ${getPerformancePercentageHtml_Desktop(
            d.categories?.performance
          )}; font-weight: bold;">${getPercentage(
            d.categories?.performance
          )}</span></td><td>${getColoredPercentage(
            d.categories?.seo
          )}</td><td>${getColoredPercentage(
            d.categories?.accessibility
          )}</td></tr>`;
        }
        if (types.mobile) {
          const m = types.mobile;
          html += `<tr><td><strong>Mobile</strong></td><td style="word-wrap: break-word; max-width: 300px;">${url}</td><td><span style="color: ${getPerformancePercentageHtml_Mobile(
            m.categories?.performance
          )}; font-weight: bold;">${getPercentage(
            m.categories?.performance
          )}</span></td><td>${getColoredPercentage(
            m.categories?.seo
          )}</td><td>${getColoredPercentage(
            m.categories?.accessibility
          )}</td></tr>`;
        }
        return html;
      })
      .join("");
  };

  const getVitals = () => {
    return Object.entries(grouped)
      .map(([url, types]) => {
        let html = "";
        if (types.desktop) {
          const d = types.desktop.audits;
          html += `<tr><td>Desktop</td><td style="word-wrap: break-word; max-width: 300px;">${url}</td><td>${
            d?.largestContentfulPaint || "N/A"
          }</td><td>${d?.firstContentfulPaint || "N/A"}</td><td>${
            d?.totalBlockingTime || "N/A"
          }</td><td>${d?.cumulativeLayoutShift || "N/A"}</td><td>${
            d?.speedIndex || "N/A"
          }</td></tr>`;
        }
        if (types.mobile) {
          const m = types.mobile.audits;
          html += `<tr><td>Mobile</td><td style="word-wrap: break-word; max-width: 300px;">${url}</td><td>${
            m?.largestContentfulPaint || "N/A"
          }</td><td>${m?.firstContentfulPaint || "N/A"}</td><td>${
            m?.totalBlockingTime || "N/A"
          }</td><td>${m?.cumulativeLayoutShift || "N/A"}</td><td>${
            m?.speedIndex || "N/A"
          }</td></tr>`;
        }
        return html;
      })
      .join("");
  };

  const avgTable = () => {
    const dPerf = calculateAvg(summaryData, "desktop", "performance");
    const mPerf = calculateAvg(summaryData, "mobile", "performance");
    const dSeo = calculateAvg(summaryData, "desktop", "seo");
    const mSeo = calculateAvg(summaryData, "mobile", "seo");
    const dAcc = calculateAvg(summaryData, "desktop", "accessibility");
    const mAcc = calculateAvg(summaryData, "mobile", "accessibility");

    return `
      <h3 style="font-size: 16px; margin-top: 30px;">Total Site Averages</h3>
      <table style="font-size: 14px;">
        <thead>
          <tr><th style="background:#add8e6">Average Type</th><th style="background:#add8e6">Average Score</th></tr>
        </thead>
        <tbody>
          <tr><td style="color: #800080; font-weight: bold;">Total site average Performance for Desktop</td><td style="color: ${getPerformancePercentageHtml_Desktop(
            dPerf
          )}; font-weight: bold;">${getPercentage(dPerf)}</td></tr>
          <tr><td style="color: #1976D2; font-weight: bold;">Total site average Performance for Mobile</td><td style="color: ${getPerformancePercentageHtml_Mobile(
            mPerf
          )}; font-weight: bold;">${getPercentage(mPerf)}</td></tr>
          <tr><td style="color: green; font-weight: bold;">Total site average SEO for Desktop</td><td>${getColoredPercentage(
            dSeo
          )}</td></tr>
          <tr><td style="color: blue; font-weight: bold;">Total site average SEO for Mobile</td><td>${getColoredPercentage(
            mSeo
          )}</td></tr>
          <tr><td style="color: purple; font-weight: bold;">Total site average Accessibility for Desktop</td><td>${getColoredPercentage(
            dAcc
          )}</td></tr>
          <tr><td style="color: blue; font-weight: bold;">Total site average Accessibility for Mobile</td><td>${getColoredPercentage(
            mAcc
          )}</td></tr>
        </tbody>
      </table>
    `;
  };

  // ----- Build HTML (kept original structure; only appended new sections) -----
  const html = `
    <html><head><style>
      body { font-family: Arial; font-size: 14px; margin: 30px; }
      .title { text-align: center; font-size: 26px; font-weight: bold; margin-bottom: 25px; }
      .header { display: flex; justify-content: space-between; }
      h3 { font-size: 18px; margin-top: 40px; text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; word-wrap: break-word; font-size: 9px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; font-size: 9px; }
      th { background: #f0f0f0; font-size: 10px; }

      /* NEW: light info box & subtle UI bits */
      .info-box { margin: 16px 0; padding: 10px 12px; background: #f8f9fa; border: 1px solid #e8e8e8; border-radius: 6px; font-size: 12px; }
      .note-line { margin: 6px 0 10px; font-size: 12px; }
      .muted { color: #666; }
      .sub-title { font-weight: bold; margin: 8px 0 6px; }

      /* NEW: per-URL blocks */
      .url-block { border: 1px solid #e3e3e3; border-radius: 6px; padding: 10px; margin: 12px 0; }
      .url-title { font-weight: bold; font-size: 12px; word-break: break-all; }
      .pill-row { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px; }
      .pill { display: inline-block; border: 1px solid #ddd; border-radius: 999px; padding: 3px 8px; font-size: 10px; background: #fafafa; }
      .bulleted { padding-left: 18px; margin: 8px 0; }
    </style></head><body>

      <div class="header">
        <img src="${logo}" alt="Logo" width="120" />
        <div style="text-align:right">QED42 Engineering Pvt. Ltd.</div>
      </div>

      <div class="title">Lighthouse Metrics Report</div>

      <div style="margin-bottom: 20px; font-size: 12px;">
        <p><strong>Project Name:</strong> ${configData.projectName}</p>
        <p><strong>Client:</strong> ${configData.client}</p>
        <p><strong>Project Manager:</strong> ${configData.projectManager}</p>
        <p><strong>QA Manager/Lead:</strong> ${configData.qaManager}</p>
        <p><strong>Audit Date:</strong> ${
          new Date().toISOString().split("T")[0]
        }</p>
        <p><strong>Expected Time of Site Load:</strong> ${
          configData.expectedLoadTime
        }</p>
        <p><strong>Report Date:</strong> ${new Date().toISOString()}</p>
      </div>

      <!-- NEW SECTION (1): About these metrics -->
      ${renderMetricsExplainerBlock()}

      <h3>Overall Performance, SEO & Accessibility</h3>
      <table>
        <thead>
          <tr><th>Score Type</th><th>URL</th><th>Performance</th><th>SEO</th><th>Accessibility</th></tr>
        </thead>
        <tbody>
          ${getRows()}
        </tbody>
      </table>

      <h3>Core Web Vitals & Other Performance Metrics</h3>
      <table>
        <thead>
          <tr><th>Score Type</th><th>URL</th><th>LCP</th><th>FCP</th><th>TBT</th><th>CLS</th><th>Speed Index</th></tr>
        </thead>
        <tbody>
          ${getVitals()}
        </tbody>
      </table>

      ${avgTable()}

      <!-- NEW SECTION (2): Site-wide Common Issues (Summary) -->
      ${renderSiteCommonIssuesSection()}

      <!-- NEW SECTION (3): Issues by URL -->
      ${renderIssuesByUrlSection()}

    </body></html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({ path: filename, format: "A4", printBackground: true });
  await browser.close();

  console.log(`✅ PDF report generated successfully: ${filename}`);
};

module.exports = { generatePdfReportFromData };
