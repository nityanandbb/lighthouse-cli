const fs = require("fs");
const { execSync } = require("child_process");
// Require the PDF generation function
const {
  generatePdfReportFromData,
} = require("./components/generate_Pdf_Report_From_Data_v12NA.js");

const logo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..."; // trimmed for brevity

// ------------------ NEW HELPERS FOR SUMMARY -------------------
const getSummaryPoints = () => {
  try {
    const data = JSON.parse(fs.readFileSync("summary_report.json", "utf8"));
    return data.management_summary || [];
  } catch (e) {
    console.error("Error reading summary_report.json:", e.message);
    return [];
  }
};

const getCommonIssues = () => {
  try {
    const data = JSON.parse(fs.readFileSync("site_common_issues.json", "utf8"));
    return data.common_issues || [];
  } catch (e) {
    console.error("Error reading site_common_issues.json:", e.message);
    return [];
  }
};
// ---------------------------------------------------------------

// Function to read the summary data from lhci-summary.json file
const getSummaryData = () => {
  try {
    const data = fs.readFileSync("lhci-summary.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading lhci-summary.json:", error);
    return [];
  }
};

// Arrays to collect averages
const siteDesktopAvgPerf = [];
const siteMobileAvgPerf = [];
const siteDesktopSEO = [];
const siteMobileSEO = [];
const siteMobileAccessibility = [];
const siteDesktopAccessibility = [];

// Run processConfig.js
const runProcessConfig = () => {
  try {
    execSync("node processConfig.js", { stdio: "inherit" });
  } catch (error) {
    console.error("Error running processConfig.js:", error);
    process.exit(1);
  }
};

// Run lighthouse analysis generator
const runLighthouseAnalysis = () => {
  try {
    console.log("Generating Lighthouse analysis data...");
    execSync("node generateLighthouseAnalysis.js", { stdio: "inherit" });
    console.log("Lighthouse analysis completed successfully.");
  } catch (error) {
    console.error("Error running generateLighthouseAnalysis.js:", error);
  }
};

// Read the project configuration
const getConfigData = () => {
  const data = fs.readFileSync("githubconfigsFile.json", "utf8");
  return JSON.parse(data);
};

// Read analysis data
const getAnalysisData = () => {
  try {
    const data = fs.readFileSync("lighthouse-analysis-data.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading lighthouse-analysis-data.json:", error);
    return {};
  }
};

// ---------------- GENERATE FINAL HTML REPORT -------------------
const generateFinalHTMLReport = (summaryData, configData, analysisData) => {
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-");
  const filename = `lighthouse-metrics-report-${dateString}.html`;

  // Functions for coloring/percentages
  const getPassFailColor = (score) => {
    if (score >= 0.9) return "green";
    if (score < 0.9) return "red";
    return "gray";
  };

  const getPercentage = (score) => {
    return (score * 100).toFixed(0) + "%";
  };

  const getPerformancePercentageHtml_Desktop = (score) => {
    if (score >= 0.9) return "#006400";
    if (score < 0.9) return "red";
    return "black";
  };

  const getPerformancePercentageHtml_Mobile = (score) => {
    if (score >= 0.8) return "#006400";
    if (score < 0.8) return "red";
    return "black";
  };

  // Group by URL + runType
  const groupedData = summaryData.reduce((acc, entry) => {
    if (!acc[entry.url]) {
      acc[entry.url] = { desktop: [], mobile: [] };
    }
    if (entry.runType === "desktop") {
      acc[entry.url].desktop.push(entry);
    } else if (entry.runType === "mobile") {
      acc[entry.url].mobile.push(entry);
    }
    return acc;
  }, {});

  const sortedUrls = Object.keys(groupedData).sort();

  let htmlContent = `
  <html>
    <head>
      <title>Lighthouse Metrics Report</title>
      <style>
        /* (all your v11 CSS kept as is) */
        table {width:100%; border-collapse:collapse; margin-bottom:30px;}
        th,td{padding:8px;text-align:left;border:1px solid #ddd;}
        th{background:#f2f2f2;position:sticky;top:0;}
        tr:nth-child(even){background:#f9f9f9;}
        .desktop{background:#d4edda;}
        .mobile{background:#f8d7da;}
        .average-column{background:#e9ecef;font-weight:bold;border:2px solid black;}
        .average-row{border:2px solid black;}
        .summary-block{margin-top:40px; border:1px solid #ccc; padding:20px; border-radius:8px;}
        .summary-block h2{margin-top:0;}
      </style>
    </head>
    <body>
      <div id="mainReport">
        <img src="${logo}" style="float:left;width:200px;height:100px;">
        <p style="text-align:right;">QED42 Engineering Pvt. Ltd.</p>
        <h1 style="text-align:center;">Lighthouse Metrics Report</h1>
        <p><strong>Project Name:</strong> ${configData.projectName}</p>
        <p><strong>Client:</strong> ${configData.client}</p>
        <p><strong>Project Manager:</strong> ${configData.projectManager}</p>
        <p><strong>QA Manager/Lead:</strong> ${configData.qaManager}</p>
        <p><strong>Audit Date:</strong> ${
          new Date().toISOString().split("T")[0]
        }</p>
        <p><strong>Expected Load Time:</strong> ${
          configData.expectedLoadTime
        }</p>
        <p><strong>Report Date:</strong> ${new Date().toISOString()}</p>
        <table>
          <thead>
            <tr>
              <th>Score Type</th>
              <th>URL</th>
              <th class="average-column">Performance</th>
              <th class="average-column">SEO</th>
              <th>Accessibility</th>
              <th>LCP</th>
              <th>FCP</th>
              <th>TBT</th>
              <th>CLS</th>
              <th>Speed Index</th>
            </tr>
          </thead>
          <tbody>`;

  // ------------ TABLE ROWS (kept exactly from v11) ------------
  sortedUrls.forEach((url) => {
    const entries = groupedData[url];
    const desktopAverage = entries.desktop.length
      ? entries.desktop.reduce((a, e) => a + e.categories.performance, 0) /
        entries.desktop.length
      : 0;
    const mobileAverage = entries.mobile.length
      ? entries.mobile.reduce((a, e) => a + e.categories.performance, 0) /
        entries.mobile.length
      : 0;
    const desktopSEO = entries.desktop.length
      ? entries.desktop.reduce((a, e) => a + e.categories.seo, 0) /
        entries.desktop.length
      : 0;
    const mobileSEO = entries.mobile.length
      ? entries.mobile.reduce((a, e) => a + e.categories.seo, 0) /
        entries.mobile.length
      : 0;
    const desktopAccessibility = entries.desktop.length
      ? entries.desktop.reduce((a, e) => a + e.categories.accessibility, 0) /
        entries.desktop.length
      : 0;
    const mobileAccessibility = entries.mobile.length
      ? entries.mobile.reduce((a, e) => a + e.categories.accessibility, 0) /
        entries.mobile.length
      : 0;

    siteDesktopAvgPerf.push(desktopAverage);
    siteMobileAvgPerf.push(mobileAverage);
    siteDesktopSEO.push(desktopSEO);
    siteMobileSEO.push(mobileSEO);
    siteDesktopAccessibility.push(desktopAccessibility);
    siteMobileAccessibility.push(mobileAccessibility);

    if (entries.desktop.length > 0) {
      htmlContent += `
      <tr class="desktop average-row">
        <td>Desktop</td><td>${url}</td>
        <td class="average-column" style="color:${getPerformancePercentageHtml_Desktop(
          desktopAverage
        )}">${getPercentage(desktopAverage)}</td>
        <td class="average-column" style="color:${getPassFailColor(
          desktopSEO
        )}">${getPercentage(desktopSEO)}</td>
        <td style="color:${getPassFailColor(
          desktopAccessibility
        )}">${getPercentage(desktopAccessibility)}</td>
        <td>--</td><td>--</td><td>--</td><td>--</td><td>--</td>
      </tr>`;
    }
    if (entries.mobile.length > 0) {
      htmlContent += `
      <tr class="mobile average-row">
        <td>Mobile</td><td>${url}</td>
        <td class="average-column" style="color:${getPerformancePercentageHtml_Mobile(
          mobileAverage
        )}">${getPercentage(mobileAverage)}</td>
        <td class="average-column" style="color:${getPassFailColor(
          mobileSEO
        )}">${getPercentage(mobileSEO)}</td>
        <td style="color:${getPassFailColor(
          mobileAccessibility
        )}">${getPercentage(mobileAccessibility)}</td>
        <td>--</td><td>--</td><td>--</td><td>--</td><td>--</td>
      </tr>`;
    }
  });

  htmlContent += `
          </tbody>
        </table>
  `;

  // ---------------- NEW SUMMARY BLOCK ----------------
  const summaryPoints = getSummaryPoints();
  const commonIssues = getCommonIssues();
  htmlContent += `
    <div class="summary-block">
      <h2>📌 Summary</h2>
      <h3>Management Summary</h3>
      <ul>
        ${summaryPoints.map((p) => `<li>${p}</li>`).join("")}
      </ul>
      <h3>Site Common Issues</h3>
      <ul>
        ${commonIssues
          .map(
            (i) =>
              `<li><strong>${i.issue}</strong> ${
                i.fix ? "— <em>" + i.fix + "</em>" : ""
              }</li>`
          )
          .join("")}
      </ul>
    </div>
  `;

  htmlContent += `
    </body>
  </html>`;

  fs.writeFileSync(filename, htmlContent);
  console.log(`✅ Report generated: ${filename}`);
};
// ---------------------------------------------------------------

// ----------------------- MAIN EXECUTION ------------------------
async function main() {
  runProcessConfig();
  runLighthouseAnalysis();
  const summaryData = getSummaryData();
  const configData = getConfigData();
  const analysisData = getAnalysisData();
  console.log("Generating HTML report...");
  generateFinalHTMLReport(summaryData, configData, analysisData);
  await generatePdfReportFromData(logo, summaryData, configData, analysisData);
}
main().catch((e) =>
  console.error("An error occurred during report generation:", e)
);
