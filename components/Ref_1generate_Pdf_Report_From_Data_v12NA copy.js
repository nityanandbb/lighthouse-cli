// Ref will revert post developement.

const fs = require("fs");
const puppeteer = require("puppeteer");

// Required helpers from html-pdf version
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
  const percentage = getPercentage(score);
  const color = score < 0.9 ? "red" : "green";
  return `<span style="color: ${color}; font-weight: bold;">${percentage}</span>`;
};

const getPerformancePercentageHtml_Mobile = (score) => {
  const percentage = getPercentage(score);
  const color = score < 0.8 ? "red" : "green";
  return `<span style="color: ${color}; font-weight: bold;">${percentage}</span>`;
};

const calculateAverageScores = (summaryData, type, category) => {
  const filtered = summaryData.filter(
    (entry) => entry.runType.toLowerCase() === type.toLowerCase()
  );
  const values = filtered
    .map((entry) => entry.categories?.[category])
    .filter((n) => typeof n === "number");
  if (!values.length) return "N/A";
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return getPercentage(avg);
};

const groupByUrlAndDevice = (summaryData) => {
  const grouped = {};
  for (const entry of summaryData) {
    if (!grouped[entry.url]) grouped[entry.url] = {};
    grouped[entry.url][entry.runType.toLowerCase()] = entry;
  }
  return grouped;
};

const generatePdfReportFromData = async (
  logo,
  summaryData,
  configData,
  analysisData
) => {
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-").replace(/\..+/, "");
  const pdfFilename = `lighthouse-metrics-report-${dateString}.pdf`;

  const pdfHtmlContent = generateHtmlContent(
    logo,
    summaryData,
    configData,
    analysisData
  );

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(pdfHtmlContent, { waitUntil: "networkidle0" });

    await page.pdf({
      path: pdfFilename,
      format: "A4",
      printBackground: true,
      margin: {
        top: "1cm",
        bottom: "1cm",
        left: "1cm",
        right: "1cm",
      },
    });

    await browser.close();
    console.log(`✅ PDF report generated successfully: ${pdfFilename}`);
  } catch (error) {
    console.error("❌ Failed to generate PDF using Puppeteer:", error);
  }
};

function generateHtmlContent(logo, summaryData, configData, analysisData) {
  const dateNow = new Date();
  const auditDate = dateNow.toISOString().split("T")[0];
  const reportDate = dateNow.toISOString();

  const avgDesktopPerf = calculateAverageScores(
    summaryData,
    "Desktop",
    "performance"
  );
  const avgMobilePerf = calculateAverageScores(
    summaryData,
    "Mobile",
    "performance"
  );
  const avgDesktopSEO = calculateAverageScores(summaryData, "Desktop", "seo");
  const avgMobileSEO = calculateAverageScores(summaryData, "Mobile", "seo");
  const avgDesktopAccess = calculateAverageScores(
    summaryData,
    "Desktop",
    "accessibility"
  );
  const avgMobileAccess = calculateAverageScores(
    summaryData,
    "Mobile",
    "accessibility"
  );

  const grouped = groupByUrlAndDevice(summaryData);

  const rows = Object.entries(grouped)
    .map(([url, types]) => {
      const desktop = types.desktop;
      const mobile = types.mobile;
      let html = "";
      if (desktop) {
        html += `<tr>
        <td>Desktop</td>
        <td>${url}</td>
        <td>${getPerformancePercentageHtml_Desktop(
          desktop.categories?.performance
        )}</td>
        <td>${getPercentage(desktop.categories?.seo)}</td>
        <td>${getPercentage(desktop.categories?.accessibility)}</td>
      </tr>`;
      }
      if (mobile) {
        html += `<tr>
        <td>Mobile</td>
        <td>${url}</td>
        <td>${getPerformancePercentageHtml_Mobile(
          mobile.categories?.performance
        )}</td>
        <td>${getPercentage(mobile.categories?.seo)}</td>
        <td>${getPercentage(mobile.categories?.accessibility)}</td>
      </tr>`;
      }
      return html;
    })
    .join("");

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .title { text-align: center; margin-top: 10px; font-size: 24px; font-weight: bold; }
          .project-info p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logo}" alt="Logo" width="100" height="50" />
          <div class="project-info">
            <p><strong>Project Name:</strong> ${
              configData.projectName || "N/A"
            }</p>
            <p><strong>Client:</strong> ${configData.client || "N/A"}</p>
            <p><strong>Project Manager:</strong> ${
              configData.projectManager || "N/A"
            }</p>
            <p><strong>QA Manager/Lead:</strong> ${
              configData.qaManager || "N/A"
            }</p>
            <p><strong>Expected Load Time:</strong> ${
              configData.expectedLoadTime || "N/A"
            }</p>
            <p><strong>Audit Date:</strong> ${auditDate}</p>
            <p><strong>Report Date:</strong> ${reportDate}</p>
          </div>
        </div>
        <div class="title">Lighthouse Metrics Report</div>

        <table>
          <thead>
            <tr>
              <th>Score Type</th>
              <th>URL</th>
              <th>Performance</th>
              <th>SEO</th>
              <th>Accessibility</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <h3 style="margin-top: 30px;">Total Site Averages</h3>
        <table>
          <thead>
            <tr>
              <th>Average Type</th>
              <th>Average Score</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total site average Performance for Desktop</td><td>${avgDesktopPerf}</td></tr>
            <tr><td>Total site average Performance for Mobile</td><td>${avgMobilePerf}</td></tr>
            <tr><td>Total site average SEO for Desktop</td><td>${avgDesktopSEO}</td></tr>
            <tr><td>Total site average SEO for Mobile</td><td>${avgMobileSEO}</td></tr>
            <tr><td>Total site average Accessibility for Desktop</td><td>${avgDesktopAccess}</td></tr>
            <tr><td>Total site average Accessibility for Mobile</td><td>${avgMobileAccess}</td></tr>
          </tbody>
        </table>

        <h3 style="margin-top: 30px;">Core Web Vitals</h3>
        <table>
          <thead>
            <tr>
              <th>Score Type</th>
              <th>URL</th>
              <th>LCP</th>
              <th>FCP</th>
              <th>TBT</th>
              <th>CLS</th>
              <th>Speed Index</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(grouped)
              .map(([url, types]) => {
                let html = "";
                if (types.desktop) {
                  html += `<tr>
                  <td>Desktop</td>
                  <td>${url}</td>
                  <td>${
                    types.desktop.audits?.largestContentfulPaint || "N/A"
                  }</td>
                  <td>${
                    types.desktop.audits?.firstContentfulPaint || "N/A"
                  }</td>
                  <td>${types.desktop.audits?.totalBlockingTime || "N/A"}</td>
                  <td>${
                    types.desktop.audits?.cumulativeLayoutShift || "N/A"
                  }</td>
                  <td>${types.desktop.audits?.speedIndex || "N/A"}</td>
                </tr>`;
                }
                if (types.mobile) {
                  html += `<tr>
                  <td>Mobile</td>
                  <td>${url}</td>
                  <td>${
                    types.mobile.audits?.largestContentfulPaint || "N/A"
                  }</td>
                  <td>${types.mobile.audits?.firstContentfulPaint || "N/A"}</td>
                  <td>${types.mobile.audits?.totalBlockingTime || "N/A"}</td>
                  <td>${
                    types.mobile.audits?.cumulativeLayoutShift || "N/A"
                  }</td>
                  <td>${types.mobile.audits?.speedIndex || "N/A"}</td>
                </tr>`;
                }
                return html;
              })
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

module.exports = { generatePdfReportFromData };
