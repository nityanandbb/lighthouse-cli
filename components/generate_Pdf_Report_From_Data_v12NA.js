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

  const html = `
    <html><head><style>
      body { font-family: Arial; font-size: 14px; margin: 30px; }
      .title { text-align: center; font-size: 26px; font-weight: bold; margin-bottom: 25px; }
      .header { display: flex; justify-content: space-between; }
      h3 { font-size: 18px; margin-top: 40px; text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; word-wrap: break-word; font-size: 9px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; font-size: 9px; }
      th { background: #f0f0f0; font-size: 10px; }
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
