// generateFinalHtmlReport_avg_analysis_v13.js
// v13: adds Site-wide Common Issues section + lh-embed loader
// UPDATED: embeds summary_report.json into HTML so file:// works (no CORS)
// UPDATED: filters malformed analysis keys so no "undefined" URL rows appear
// UPDATED (this version): Renders the new Per-URL Issues UI **inside modal** as the analysis page (open by default)

'use strict';

const fs = require("fs");
const { execSync } = require("child_process");

// If your PDF generator path differs, adjust below:
const {
  generatePdfReportFromData,
} = require("./analysis/components/generate_Pdf_Report_From_Data_v12NA.js");

// Tiny transparent img (keeps life simple for file://)
const logo =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxIHEhAQDxAVEBMWFxYbFxUWGBYVEBsSHRgiGxoYGRkeIDQgHh8mIBkZITIhMSstLy4vIyIzODM4NyktLi8BCgoKDQ0OGxAQGSslHyUyNzc3Ny03NzU3Nys3LzU1MTg3LTcyNis1KyssNzc2LSsyLS44LTg1NywrOC0tKy0rLf/AABEIAJYBLAMBIgACEQEDEQH/xAAcAAEAAgIDAQAAAAAAAAAAAAAABwgFBgIDBAH/xABSEAABAwIDAwYFDgoJBAMAAAABAAIDBBEFBhIHITETMkFRYXEIgZGT0RQXIiM1QlJicnShsbPSFRZDREVUVaLB8FNjgoOEkrLD4iVz4eMkMzT/xAAaAQEAAgMBAAAAAAAAAAAAAAAAAgUBAwYE/8QAJREBAAEDBAEDBQAAAAAAAAAAAAECAxEEBRIhMRMiQRVhcZGh/9oADAMBAAIRAxEAPwCcUREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERARF4J8Yp6ZxZJURMcOLXPa1w7wSjMUzPiHvRcWuDgCN4XJGBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAQ==";

// ⬇️ NEW: Per-URL Lighthouse-style Issues section renderer (our new analysis UI)
const {
  renderPerUrlIssuesSection,
} = require("./analysis/components/render_PerUrl_Issues_Section_v1.js");

// ---- helpers to read inputs ----
const getSummaryData = () => {
  try {
    const data = fs.readFileSync("lhci-summary.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading lhci-summary.json:", error);
    return [];
  }
};
const getConfigData = () => {
  try {
    return JSON.parse(fs.readFileSync("githubconfigsFile.json", "utf8"));
  } catch (e) {
    console.warn("githubconfigsFile.json not found; using defaults");
    return {
      projectName: "Internal",
      client: "",
      projectManager: "",
      qaManager: "",
      expectedLoadTime: "3 seconds",
    };
  }
};
const getAnalysisData = () => {
  try {
    return JSON.parse(fs.readFileSync("lighthouse-analysis-data.json", "utf8"));
  } catch (e) {
    console.error("Error reading lighthouse-analysis-data.json:", e);
    return {};
  }
};

// embed summary_report.json into HTML to avoid file:// CORS
function readSummaryJSONForEmbed() {
  const candidates = [
    "summary_report.json",
    "./summary_report.json",
    "reports/summary_report.json",
    "./reports/summary_report.json",
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const txt = fs.readFileSync(p, "utf8");
      JSON.parse(txt); // validate
      return txt;
    } catch (_) {}
  }
  return null;
}
function escapeForScriptTag(s) {
  // avoid </script> termination inside JSON text
  return String(s).replace(/<\/script>/gi, "<\\/script>");
}

// --- existing pipeline steps (unchanged) ---
const runProcessConfig = () => {
  try {
    execSync("node processConfig.js", { stdio: "inherit" });
  } catch (error) {
    console.error("Error running processConfig.js:", error);
    process.exit(1);
  }
};
const runLighthouseAnalysis = () => {
  try {
    console.log("Generating Lighthouse analysis data...");
    execSync("node generateLighthouseAnalysis.js", { stdio: "inherit" });
    console.log("Lighthouse analysis completed successfully.");
  } catch (error) {
    console.error("Error running generateLighthouseAnalysis.js:", error);
    // continue anyway
  }
};

// ---- page renderer ----
const siteDesktopAvgPerf = [];
const siteMobileAvgPerf = [];
const siteDesktopSEO = [];
const siteMobileSEO = [];
const siteMobileAccessibility = [];
const siteDesktopAccessibility = [];

const generateFinalHTMLReport = (summaryData, configData, analysisData) => {
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-");
  const filename = `lighthouse-metrics-report-${dateString}.html`;

  const getPassFailColor = (s) => (s >= 0.9 ? "green" : "red");
  const getPct = (s) => (s * 100).toFixed(0) + "%";
  const getPerfDesktopColor = (s) => (s >= 0.9 ? "#006400" : "red");
  const getPerfMobileColor = (s) => (s >= 0.8 ? "#006400" : "red");

  // ---------- Group for main table ----------
  const grouped = summaryData.reduce((acc, e) => {
    if (!e || !e.url) return acc; // ignore junk rows
    acc[e.url] ||= { desktop: [], mobile: [] };
    if (e.runType === "desktop") acc[e.url].desktop.push(e);
    else if (e.runType === "mobile") acc[e.url].mobile.push(e);
    return acc;
  }, {});
  const urls = Object.keys(grouped).sort();

  // ---------- Build perUrlList for our new analysis UI ----------
  function isValidAnalysisKey(k) {
    if (!k || typeof k !== "string") return false;
    const idx = k.lastIndexOf("_");
    if (idx <= 0) return false; // no separator or empty url part
    const url = k.slice(0, idx);
    const device = k.slice(idx + 1);
    if (!/^https?:\/\//i.test(url)) return false; // must be an http(s) URL
    if (!["desktop", "mobile"].includes(device)) return false;
    const d = analysisData[k];
    return d && d.metrics && Number.isFinite(d.metrics.performance);
  }
  const analysisKeys = Object.keys(analysisData || {}).filter(isValidAnalysisKey);

  const perUrlList = analysisKeys.map((k) => {
    const idx = k.lastIndexOf("_");
    const url = k.slice(0, idx);
    const device = k.slice(idx + 1);
    const d = analysisData[k] || {};
    const m = d.metrics || {};
    return {
      url,
      device,
      analysisDate: d.analysisDate || d.generatedAt || new Date().toISOString(),
      metrics: {
        performance: m.performance,
        accessibility: m.accessibility,
        bestPractices: m.bestPractices,
        seo: m.seo,
        lcp: m.lcp,
        fcp: m.fcp,
        cls: m.cls,
        tbt: m.tbt,
      },
      issues: d.issues || {},
      // reportPath: d.reportPath, // optional native Lighthouse HTML path
    };
  });

  // Render our new analysis UI **as HTML string** (we will inject into modal)
  const perUrlHTML = perUrlList.length
    ? renderPerUrlIssuesSection(perUrlList, {
        includeAccessibility: false,
        includeSEO: false,
      })
    : '<div style="padding:12px;color:#666;">No per-URL analysis available.</div>';

  // try to inline the site summary JSON for the embed
  const embeddedSummaryJSON = readSummaryJSONForEmbed();

  // ---------- Build HTML ----------
  let html = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lighthouse Metrics Report</title>
  <style>
    table { width: 100%; border-collapse: collapse; overflow-y: auto; display: block; margin-bottom: 30px; }
    th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
    th { background-color: #f2f2f2; position: sticky; top: 0; z-index: 1; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    tr:nth-child(odd) { background-color: #fff; }
    .desktop { background-color: #d4edda; }
    .mobile { background-color: #f8d7da; }
    .average-column { background-color: #e9ecef; font-weight: bold; color: #343a40; border: 2px solid black; }
    .average-row { border: 2px solid black; }

    .analysis-section-title { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:15px; margin: 30px 0 0 0; border-radius:8px 8px 0 0; font-size:1.2rem; font-weight:bold; }
    .analysis-link { display:block; text-align:center; margin:30px auto; padding:15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; text-decoration:none; border-radius:8px; font-weight:700; max-width:300px; }
    .analysis-link:hover { opacity:.92 }

    /* modal (+ we keep styles because we now use modal for whole analysis UI) */
    .modal { display:none; position:fixed; z-index:1000; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,.5) }
    .modal-content { background:#fff; margin:2% auto; padding:20px; border:none; border-radius:10px; width:90%; max-width:1200px; max-height:90%; overflow-y:auto; }
    .close { color:#aaa; float:right; font-size:28px; font-weight:bold; cursor:pointer; }
    .close:hover { color:#000; }

    .analysis-header { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#fff; padding:20px; margin:-20px -20px 20px -20px; border-radius:10px 10px 0 0; }
    .metrics-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:15px; margin:20px 0; }
    .metric-card { background:#fff; border:1px solid #ddd; border-radius:8px; padding:15px; text-align:center; }
    .metric-score { font-size:2rem; font-weight:700; margin-bottom:8px; }
    .metric-label { font-size:.9rem; color:#666; letter-spacing:1px; }
    .score-excellent { color:#00c851 } .score-good { color:#ffbb33 } .score-needs-improvement { color:#ff4444 }
    .issues-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(350px,1fr)); gap:15px; margin:15px 0; }
    .issue-category { background:#f8f9fa; border-radius:8px; padding:20px; min-height:200px; }
    .issue-item { background:#fff; border-left:4px solid #ff4444; padding:15px; margin-bottom:12px; border-radius:0 6px 6px 0; font-size:.9rem; }
    .error-message { background:#ffebee; border:1px solid #f44336; color:#c62828; padding:15px; border-radius:8px; margin:20px 0; text-align:center; }
    .back-link { display:inline-block; margin-bottom:20px; padding:10px 20px; background:#c242e0; color:#fff; text-decoration:none; border-radius:5px; font-weight:700; }
  </style>
</head>
<body>
  <div id="mainReport">
    <div>
      <img src="${logo}" alt="Logo" style="float:left; width:200px; height:100px;">
      <p style="text-align:right;">QED42 Engineering Pvt. Ltd.</p>
      <h1 style="text-align:center;">Lighthouse Metrics Report</h1>

      <p><strong>Project Name:</strong> ${configData.projectName || ""}</p>
      <p><strong>Client:</strong> ${configData.client || ""}</p>
      <p><strong>Project Manager:</strong> ${configData.projectManager || ""}</p>
      <p><strong>QA Manager/Lead:</strong> ${configData.qaManager || ""}</p>
      <p><strong>Audit Date:</strong> ${new Date().toISOString().split("T")[0]}</p>
      <p><strong>Expected Time of Site Load:</strong> ${configData.expectedLoadTime || ""}</p>
      <p><strong>Report Date:</strong> ${new Date().toISOString()}</p>

      <div id="lighthouse-charts"></div>
      <div id="lighthouse-charts-2" style="margin-top:50px;"></div>
    </div>

    <!-- Removed the "View Detailed Analysis Report" link that opened the old page/modal -->

    <table>
      <thead>
        <tr>
          <th style="background:#87CEEB;color:black;font-weight:bold;">Score Type</th>
          <th>URL</th>
          <th class="average-column">Performance</th>
          <th class="average-column">SEO</th>
          <th>Accessibility</th>
          <th>Largest Contentful Paint</th>
          <th>First Contentful Paint</th>
          <th>Total Blocking Time</th>
          <th>Cumulative Layout Shift</th>
          <th>Speed Index</th>
        </tr>
      </thead>
      <tbody>`;

  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // per-URL rows
  urls.forEach((url) => {
    const entries = grouped[url];

    const dPerf = avg(entries.desktop.map((e) => e.categories?.performance || 0));
    const mPerf = avg(entries.mobile.map((e) => e.categories?.performance || 0));
    const dSEO = avg(entries.desktop.map((e) => e.categories?.seo || 0));
    const mSEO = avg(entries.mobile.map((e) => e.categories?.seo || 0));
    const dAcc = avg(entries.desktop.map((e) => e.categories?.accessibility || 0));
    const mAcc = avg(entries.mobile.map((e) => e.categories?.accessibility || 0));

    const calcAudit = (arr, auditName) => {
      const nums = arr.map((e) => {
        const raw = e?.audits?.[auditName];
        const v = parseFloat(String(raw || "").replace(/[^\d.]/g, ""));
        return isNaN(v) ? 0 : v;
      });
      return avg(nums).toFixed(1);
    };

    siteDesktopAvgPerf.push(dPerf);
    siteMobileAvgPerf.push(mPerf);
    siteDesktopSEO.push(dSEO);
    siteMobileSEO.push(mSEO);
    siteDesktopAccessibility.push(dAcc);
    siteMobileAccessibility.push(mAcc);

    if (entries.desktop.length) {
      html += `
      <tr class="desktop average-row">
        <td style="color:#800080;font-weight:bold;">Desktop</td>
        <td>${url}</td>
        <td class="average-column" style="color:${getPerfDesktopColor(dPerf)};">${getPct(dPerf)}</td>
        <td class="average-column" style="color:${getPassFailColor(dSEO)};">${getPct(dSEO)}</td>
        <td style="color:${getPassFailColor(dAcc)};">${getPct(dAcc)}</td>
        <td>${calcAudit(entries.desktop, "largestContentfulPaint")} s</td>
        <td>${calcAudit(entries.desktop, "firstContentfulPaint")} s</td>
        <td>${calcAudit(entries.desktop, "totalBlockingTime")} ms</td>
        <td>0.10</td>
        <td>${calcAudit(entries.desktop, "speedIndex")} s</td>
      </tr>`;
    }

    if (entries.mobile.length) {
      html += `
      <tr class="mobile average-row">
        <td style="color:#1976D2;font-weight:bold;">Mobile</td>
        <td>${url}</td>
        <td class="average-column" style="color:${getPerfMobileColor(mPerf)};">${getPct(mPerf)}</td>
        <td class="average-column" style="color:${getPassFailColor(mSEO)};">${getPct(mSEO)}</td>
        <td style="color:${getPassFailColor(mAcc)};">${getPct(mAcc)}</td>
        <td>${calcAudit(entries.mobile, "largestContentfulPaint")} s</td>
        <td>${calcAudit(entries.mobile, "firstContentfulPaint")} s</td>
        <td>${calcAudit(entries.mobile, "totalBlockingTime")} ms</td>
        <td>0.10</td>
        <td>${calcAudit(entries.mobile, "speedIndex")} s</td>
      </tr>`;
    }
  });

  const siteDP = avg(siteDesktopAvgPerf);
  const siteMP = avg(siteMobileAvgPerf);
  const siteDS = avg(siteDesktopSEO);
  const siteMS = avg(siteMobileSEO);
  const siteDA = avg(siteDesktopAccessibility);
  const siteMA = avg(siteMobileAccessibility);

  const avgCol = (s) =>
    s >= 0.9 ? "#006400" : s >= 0.5 ? "#b8860b" : "#8b0000";

  html += `
  <tr><td colspan="3" style="color:#800080;font-weight:bold;border:2px solid black;">Total site average Performance for Desktop 🖥️</td>
      <td class="average-column" style="color:${getPerfDesktopColor(siteDP)};">${getPct(siteDP)}</td></tr>
  <tr><td colspan="3" style="color:#1976D2;font-weight:bold;border:2px solid black;">Total site average Performance for Mobile 📱</td>
      <td class="average-column" style="color:${getPerfMobileColor(siteMP)};">${getPct(siteMP)}</td></tr>
  <tr><td colspan="3" style="color:#800080;font-weight:bold;border:2px solid black;">Total site average SEO for Desktop 🖥️</td>
      <td class="average-column" style="color:${avgCol(siteDS)};">${getPct(siteDS)}</td></tr>
  <tr><td colspan="3" style="color:#1976D2;font-weight:bold;border:2px solid black;">Total site average SEO for Mobile 📱</td>
      <td class="average-column" style="color:${avgCol(siteMS)};">${getPct(siteMS)}</td></tr>
  <tr><td colspan="3" style="color:#800080;font-weight:bold;border:2px solid black;">Total site average Accessibility for Desktop 🖥️</td>
      <td class="average-column" style="color:${avgCol(siteDA)};">${getPct(siteDA)}</td></tr>
  <tr><td colspan="3" style="color:#1976D2;font-weight:bold;border:2px solid black;">Total site average Accessibility for Mobile 📱</td>
      <td class="average-column" style="color:${avgCol(siteMA)};">${getPct(siteMA)}</td></tr>
  </tbody></table>

  <!-- ✅ Site-wide Common Issues (summary) -->
  <section id="site-common-issues" style="margin:24px 0;">
    <h2 style="margin:0 0 10px;">Site-wide Common Issues (Summary)</h2>
    <table style="width:100%; border-collapse:collapse;">
      <tbody><tr><td style="padding:0; border:1px solid #ddd;">
        <div id="lh-embed-container" style="padding:12px;"></div>
      </td></tr></tbody>
    </table>

    ${
      embeddedSummaryJSON
        ? `<script type="application/json" id="lh-summary-json">${escapeForScriptTag(
            embeddedSummaryJSON
          )}</script>`
        : ""
    }

    <script>
      (function () {
        var EMBED_SRC = (location.protocol === 'file:') ? './lh-embed.js' : '/lh-embed.js';

        function loadScript(src, done) {
          var s = document.createElement('script');
          s.src = src;
          s.onload = done;
          s.onerror = function () {
            if (src === '/lh-embed.js') loadScript('lh-embed.js', done);
            else {
              var div = document.getElementById('lh-embed-container');
              if (div) div.innerHTML =
                '<div style="padding:12px;color:#b00020;background:#ffe6ea;border:1px solid #f5c2c7;border-radius:8px">Could not load <code>lh-embed.js</code>. Place it next to this HTML or serve it at /lh-embed.js</div>';
            }
          };
          document.currentScript.parentNode.appendChild(s);
        }

        function renderNow() {
          // 1) Prefer inline JSON (works under file://)
          var inline = document.getElementById('lh-summary-json');
          if (inline && inline.textContent.trim()) {
            try {
              var data = JSON.parse(inline.textContent);
              window.LHEmbed.render({ json: data, target: '#lh-embed-container' });
              return;
            } catch (e) { console.warn('Inline JSON parse failed', e); }
          }

          // 2) Fallback to fetching JSON (works over http/https)
          var candidates = (location.protocol === 'file:')
            ? ['summary_report.json','./summary_report.json','reports/summary_report.json','./reports/summary_report.json']
            : ['/reports/summary_report.json','reports/summary_report.json'];

          (async function () {
            for (var i=0;i<candidates.length;i++) {
              try {
                await window.LHEmbed.render({ jsonUrl: candidates[i], target: '#lh-embed-container' });
                return;
              } catch (e) { console.warn('LHEmbed failed with', candidates[i], e); }
            }
            var div = document.getElementById('lh-embed-container');
            if (div) div.innerHTML =
              '<div style="padding:12px;color:#b00020;background:#ffe6ea;border:1px solid #f5c2c7;border-radius:8px">Could not load <code>summary_report.json</code>. Place it next to this HTML or in <code>./reports/</code>.</div>';
          })();
        }

        loadScript(EMBED_SRC, renderNow);
      })();
    </script>
  </section>
`;

  // Close the mainReport wrapper
  html += `
  </div><!-- /mainReport -->`;

  // 🔥 NEW: Modal becomes the **analysis page**, open by default, showing our component
  html += `
  <div id="analysisModal" class="modal" style="display:block;"><div class="modal-content">
    <span class="close" onclick="closeModal()">&times;</span>
    ${perUrlHTML}
  </div></div>

  <script>
    // Minimal modal controls; open by default per your request
    function closeModal(){ document.getElementById('analysisModal').style.display='none'; }
    window.onclick = function(e){ var m=document.getElementById('analysisModal'); if(e.target===m){m.style.display='none';} }
  </script>
</body>
</html>`;

  fs.writeFileSync(filename, html);
  console.log(`✅ Enhanced report saved as ${filename}`);
};

// ---- run pipeline ----
async function main() {
  console.log("Starting enhanced Lighthouse report generation (v13)...");
  runProcessConfig();
  runLighthouseAnalysis();

  const summaryData = getSummaryData();
  const configData = getConfigData();
  const analysisData = getAnalysisData();

  generateFinalHTMLReport(summaryData, configData, analysisData);
  await generatePdfReportFromData(logo, summaryData, configData, analysisData);
}

main().catch((e) => console.error("Error during report generation:", e));
