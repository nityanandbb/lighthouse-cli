// html pdf : not supported in ubuntu github...
// pdf improvement and ui fixes. components/generatePdfReportFromData_v10NA.js
const fs = require("fs");
const pdf = require("html-pdf");

// IMPORTANT: Assume 'getSummaryData', 'getConfigData', 'getAnalysisData'
// functions are already defined in your main script and accessible.

// Helper function to apply color based on pass/fail (Needed in PDF generation)
const getPassFailColor = (score) => {
  if (score >= 0.9) return "green";
  if (score < 0.9) return "red";
  return "gray";
};

// Helper function to get percentage (Needed in PDF generation)
const getPercentage = (score) => {
  if (score >= 0 && score <= 1) {
    return (score * 100).toFixed(0) + "%";
  } else if (score > 1 && score <= 100) {
    return score.toFixed(0) + "%";
  }
  return "N/A";
};

// NEW HELPER FUNCTION: To format performance percentages with conditional styling
const getPerformancePercentageHtml_Desktop = (score) => {
  const percentage = getPercentage(score); // Use existing getPercentage for value
  // Apply specific color and font-weight based on performance threshold
  const color = score < 0.9 ? "red" : "green";
  const fontWeight = score < 0.9 ? "bold" : "bold";

  return `<span style="color: ${color}; font-weight: ${fontWeight};">${percentage}</span>`;
};

// NEW HELPER FUNCTION: To format performance percentages with conditional styling
const getPerformancePercentageHtml_Mobile = (score) => {
  const percentage = getPercentage(score); // Use existing getPercentage for value
  // Apply specific color and font-weight based on performance threshold
  const color = score < 0.8 ? "red" : "green";
  const fontWeight = score < 0.8 ? "bold" : "bold";

  return `<span style="color: ${color}; font-weight: ${fontWeight};">${percentage}</span>`;
};

// Helper function to calculate average audits (Needed in PDF generation)
const calculateAverageAudit = (entriesArray, auditName) => {
  const total = entriesArray.reduce((acc, entry) => {
    const value = parseFloat(
      (entry.audits?.[auditName] || "0").replace(/[^\d.]/g, "")
    );
    return acc + (isNaN(value) ? 0 : value);
  }, 0);
  return entriesArray.length > 0
    ? (total / entriesArray.length).toFixed(1)
    : "0";
};

// Helper function to get average of averages (Needed in PDF generation)
const siteTotalAvgFromAvgTotal = (itsFor, avgOfAvg) => {
  const total = avgOfAvg.reduce((acc, curr) => acc + curr, 0);
  let avg = avgOfAvg.length > 0 ? total / avgOfAvg.length : 0;
  return avg;
};

// Helper function to get average color for scores (Needed in PDF generation)
const getAverageColor = (score) => {
  if (score >= 0.9) return "#006400"; // Dark Green - Excellent
  if (score >= 0.5) return "#b8860b"; // Dark Yellow (GoldenRod) - Needs Improvement
  if (score < 0.5) return "#8b0000"; // Dark Red - Poor
  return "black";
};

// New function to generate the PDF report from provided data
const generatePdfReportFromData = async (
  logo,
  summaryData,
  configData,
  analysisData
) => {
  // Generate a unique filename for the PDF report
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-").replace(/\..+/, "");
  const pdfFilename = `lighthouse-metrics-report-${dateString}.pdf`;

  // Start building the HTML content for the PDF
  let pdfHtmlContent = `
    <html>
      <head>
        <title>Lighthouse Metrics Report (PDF)</title>
        <style>
          /* Basic body and font styles for PDF readability */
          body { font-family: Arial, sans-serif; margin: 15px; font-size: 10pt; }

          /* Report Header and Details */
          .logo-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .company-info {
            text-align: right;
            font-size: 0.9rem;
          }
          .report-title {
            text-align: center;
            font-size: 1.5rem;
            margin-top: 10px;
            margin-bottom: 15px;
          }
          .project-details {
             margin-top: 20px; /* Added margin for spacing */
          }
          .project-details p {
            margin: 3px 0;
            font-size: 0.95rem;
          }
          .table-section-title {
            font-size: 1rem;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 15px;
            padding: 5px 0;
            border-bottom: 2px solid #ccc;
          }

          /* Table styling for PDF layout */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto; /* Allow tables to break across pages */
            font-size: 7pt; /* Reduced table font size */
            table-layout: fixed; /* Crucial for controlling column widths in PDF */
          }
          th, td {
            padding: 6px;
            text-align: left;
            border: 1px solid #ddd;
            word-wrap: break-word; /* Ensure long content wraps */
            overflow-wrap: break-word; /* For newer browsers */
            hyphens: auto; /* Allow hyphens for better word breaking */
          }
          th {
            font-size: 7pt; /* Further reduced font size for table headers */
          }
          /* Column widths for main tables */
          .col-score-type { width: 10%; }
          .col-url { width: 25%; }
          .col-perf { width: 10%; } /* Renamed to match header */
          .col-seo { width: 10%; } /* Renamed to match header */
          .col-accessibility { width: 10%; }
          .col-lcp { width: 8%; }
          .col-fcp { width: 8%; }
          .col-tbt { width: 7%; }
          .col-cls { width: 8%; } /* Adjusted width for CLS */
          .col-speed-index { width: 8%; } /* Adjusted width for Speed Index */


          th {
            background-color: #f2f2f2;
          }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:nth-child(odd) { background-color: #fff; }
          .desktop { background-color: #d4edda; }
          .mobile { background-color: #f8d7da; }
          .pass { color: green; }
          .fail { color: red; }
          .highlight {
            background-color: #f0ad4e;
          }
          .average-column {
            background-color: #e9ecef;
            font-weight: bold;
            color: #343a40;
            border: 2px solid black;
          }
          .average-row {
            border: 2px solid black;
          }

          /* Analysis Section Styling for PDF */
          .analysis-section {
            page-break-before: always; /* Force analysis section to start on a new page */
            padding-top: 20px; /* Padding at the top of the new page */
          }
          .analysis-section-title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px;
            margin: 20px 0 15px 0;
            border-radius: 8px 8px 0 0;
            font-size: 1.1rem;
            font-weight: bold;
          }
          
          .analysis-entry-block {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ccc;
            border-radius: 8px;
            page-break-inside: avoid; /* Keep analysis block for one URL/device together */
          }

          .analysis-entry-block h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1rem;
          }
          .analysis-entry-block p {
            line-height: 1.5;
            margin-bottom: 10px;
            text-align: justify; /* Justify paragraph text for better PDF look */
          }
          .analysis-block-list { /* For issues/recommendations on new lines */
              margin-left: 15px;
              margin-bottom: 10px;
              list-style-type: disc;
          }
          .analysis-block-list li {
              margin-bottom: 5px;
              line-height: 1.4;
          }
          .issue-text {
              color: #d32f2f; /* Red for issues */
              font-weight: bold;
          }
          .recommendation-text {
              color: #2e7d32; /* Green for recommendations */
              font-weight: bold;
          }


          .error-message {
            background: #ffebee;
            border: 1px solid #f44336;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-size: 0.9rem;
          }
          
          /* General PDF Layout and Typography */
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
          p { page-break-inside: avoid; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div class="logo-section">
          <img src="${logo}" alt="Logo" style="width: 150px; height: 75px;">
          <p class="company-info">QED42 Engineering Pvt. Ltd.</p>
        </div>
        <h1 class="report-title">Lighthouse Metrics Report</h1>

        <div class="project-details">
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
          <p><strong>Audit Date:</strong> ${
            new Date().toISOString().split("T")[0]
          }</p>
          <p><strong>Expected Time of Site Load:</strong> ${
            configData.expectedLoadTime || "N/A"
          }</p>
          <p><strong>Report Date:</strong> ${new Date().toISOString()}</p>
        </div>
        
        <div class="table-section-title">Overall Performance, SEO & Accessibility</div>
        <table>
          <thead>
            <tr>
              <th class="col-score-type" style="background-color: #87CEEB; color: black; font-weight: bold;">Score Type</th>
              <th class="col-url">URL</th>
              <th class="col-perf average-column">Performance</th>
              <th class="col-seo average-column">SEO</th>
              <th class="col-accessibility">Accessibility</th>
            </tr>
          </thead>
          <tbody>`;

  // --- Re-use Data Processing Logic from your original HTML generation ---
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

  const siteDesktopAvgPerf = [];
  const siteMobileAvgPerf = [];
  const siteDesktopSEO = [];
  const siteMobileSEO = [];
  const siteMobileAccessibility = [];
  const siteDesktopAccessibility = [];

  sortedUrls.forEach((url) => {
    const entries = groupedData[url];

    const desktopTotalPerformance = entries.desktop.reduce(
      (acc, entry) => acc + (entry.categories?.performance || 0),
      0
    );
    const desktopAverage =
      entries.desktop.length > 0
        ? desktopTotalPerformance / entries.desktop.length
        : 0;

    const mobileTotalPerformance = entries.mobile.reduce(
      (acc, entry) => acc + (entry.categories?.performance || 0),
      0
    );
    const mobileAverage = mobileTotalPerformance / entries.mobile.length || 0; // Handle division by zero

    const desktopTotalSEO = entries.desktop.reduce(
      (acc, entry) => acc + (entry.categories?.seo || 0),
      0
    );
    const desktopSEO = desktopTotalSEO / entries.desktop.length || 0;

    const mobileTotalSEO = entries.mobile.reduce(
      (acc, entry) => acc + (entry.categories?.seo || 0),
      0
    );
    const mobileSEO = mobileTotalSEO / entries.mobile.length || 0;

    const desktopTotalAccessibility = entries.desktop.reduce(
      (acc, entry) => acc + (entry.categories?.accessibility || 0),
      0
    );
    const desktopAccessibility =
      desktopTotalAccessibility / entries.desktop.length || 0;

    const mobileTotalAccessibility = entries.mobile.reduce(
      (acc, entry) => acc + (entry.categories?.accessibility || 0),
      0
    );
    const mobileAccessibility =
      mobileTotalAccessibility / entries.mobile.length || 0;

    siteDesktopAvgPerf.push(desktopAverage);
    siteMobileAvgPerf.push(mobileAverage);
    siteDesktopSEO.push(desktopSEO);
    siteMobileSEO.push(mobileSEO);
    siteMobileAccessibility.push(mobileAccessibility);
    siteDesktopAccessibility.push(desktopAccessibility);

    if (entries.desktop.length > 0) {
      const seoColor = getPassFailColor(desktopSEO);
      const accessibilityColor = getPassFailColor(desktopAccessibility);

      pdfHtmlContent += `
                <tr class="desktop highlight average-row">
                    <td class="col-score-type" style="color: #800080; font-weight: bold;">Desktop</td>
                    <td class="col-url">${url}</td>
                    <td class="col-perf average-column">${getPerformancePercentageHtml_Desktop(
                      desktopAverage
                    )}</td>
                    <td class="col-seo average-column" style="color: ${seoColor};">${getPercentage(
        desktopSEO
      )}</td>
                    <td class="col-accessibility" style="color: ${accessibilityColor};">${getPercentage(
        desktopAccessibility
      )}</td>
                </tr>`;
    }

    if (entries.mobile.length > 0) {
      const seoColor = getPassFailColor(mobileSEO);
      const accessibilityColor = getPassFailColor(mobileAccessibility);

      pdfHtmlContent += `
                <tr class="mobile highlight average-row">
                    <td class="col-score-type" style="color: #1976D2; font-weight: bold;">Mobile</td>
                    <td class="col-url">${url}</td>
                    <td class="col-perf average-column">${getPerformancePercentageHtml_Mobile(
                      mobileAverage
                    )}</td>
                    <td class="col-seo average-column" style="color: ${seoColor};">${getPercentage(
        mobileSEO
      )}</td>
                    <td class="col-accessibility" style="color: ${accessibilityColor};">${getPercentage(
        mobileAccessibility
      )}</td>
                </tr>`;
    }
  });

  pdfHtmlContent += `
          </tbody>
        </table>

        <div class="table-section-title">Core Web Vitals & Other Performance Metrics</div>
        <table>
            <thead>
                <tr>
                    <th class="col-score-type" style="background-color: #87CEEB; color: black; font-weight: bold;">Score Type</th>
                    <th class="col-url">URL</th>
                    <th class="col-lcp">Largest Contentful Paint</th>
                    <th class="col-fcp">First Contentful Paint</th>
                    <th class="col-tbt">Total Blocking Time</th>
                </tr>
            </thead>
            <tbody>`;

  sortedUrls.forEach((url) => {
    const entries = groupedData[url];

    if (entries.desktop.length > 0) {
      pdfHtmlContent += `
                <tr class="desktop highlight average-row">
                    <td class="col-score-type" style="color: #800080; font-weight: bold;">Desktop</td>
                    <td class="col-url">${url}</td>
                    <td class="col-lcp">${calculateAverageAudit(
                      entries.desktop,
                      "largestContentfulPaint"
                    )} s</td>
                    <td class="col-fcp">${calculateAverageAudit(
                      entries.desktop,
                      "firstContentfulPaint"
                    )} s</td>
                    <td class="col-tbt">${calculateAverageAudit(
                      entries.desktop,
                      "totalBlockingTime"
                    )} ms</td>
                </tr>`;
    }

    if (entries.mobile.length > 0) {
      pdfHtmlContent += `
                <tr class="mobile highlight average-row">
                    <td class="col-score-type" style="color: #1976D2; font-weight: bold;">Mobile</td>
                    <td class="col-url">${url}</td>
                    <td class="col-lcp">${calculateAverageAudit(
                      entries.mobile,
                      "largestContentfulPaint"
                    )} s</td>
                    <td class="col-fcp">${calculateAverageAudit(
                      entries.mobile,
                      "firstContentfulPaint"
                    )} s</td>
                    <td class="col-tbt">${calculateAverageAudit(
                      entries.mobile,
                      "totalBlockingTime"
                    )} ms</td>
                </tr>`;
    }
  });

  pdfHtmlContent += `
            </tbody>
        </table>

        <div class="table-section-title">Speed Index & Cumulative Layout Shift</div>
        <table>
            <thead>
                <tr>
                    <th class="col-score-type" style="background-color: #87CEEB; color: black; font-weight: bold;">Score Type</th>
                    <th class="col-url">URL</th>
                    <th class="col-cls">Cumulative Layout Shift</th>
                    <th class="col-speed-index">Speed Index</th>
                </tr>
            </thead>
            <tbody>`;

  sortedUrls.forEach((url) => {
    const entries = groupedData[url];

    if (entries.desktop.length > 0) {
      pdfHtmlContent += `
                <tr class="desktop highlight average-row">
                    <td class="col-score-type" style="color: #800080; font-weight: bold;">Desktop</td>
                    <td class="col-url">${url}</td>
                    <td class="col-cls">0.10</td> <!-- CLS is fixed as per your previous code -->
                    <td class="col-speed-index">${calculateAverageAudit(
                      entries.desktop,
                      "speedIndex"
                    )} s</td>
                </tr>`;
    }

    if (entries.mobile.length > 0) {
      pdfHtmlContent += `
                <tr class="mobile highlight average-row">
                    <td class="col-score-type" style="color: #1976D2; font-weight: bold;">Mobile</td>
                    <td class="col-url">${url}</td>
                    <td class="col-cls">0.10</td> <!-- CLS is fixed as per your previous code -->
                    <td class="col-speed-index">${calculateAverageAudit(
                      entries.mobile,
                      "speedIndex"
                    )} s</td>
                </tr>`;
    }
  });

  pdfHtmlContent += `
            </tbody>
        </table>

        <div class="table-section-title">Total Site Averages</div>
        <table>
            <thead>
                <tr>
                    <th colspan="3" style="background-color: #87CEEB; color: black; font-weight: bold;">Average Type</th>
                    <th class="average-column" style="background-color: #87CEEB; color: black; font-weight: bold;">Average Score</th>
                </tr>
            </thead>
            <tbody>
        `;

  const avgPerformanceDesktop = siteTotalAvgFromAvgTotal(
    "desktop performance",
    siteDesktopAvgPerf
  );
  const avgPerformanceMobile = siteTotalAvgFromAvgTotal(
    "mobile performance",
    siteMobileAvgPerf
  );
  const avgAllSite_DesktopSEO = siteTotalAvgFromAvgTotal(
    "mobile",
    siteDesktopSEO
  );
  const avgAllSite_MobileSEO = siteTotalAvgFromAvgTotal(
    "mobile",
    siteMobileSEO
  );
  const avgAllSite_DesktopAccessibility = siteTotalAvgFromAvgTotal(
    "desktop accessibility",
    siteDesktopAccessibility
  );
  const avgAllSite_MobileAccessibility = siteTotalAvgFromAvgTotal(
    "mobile accessibility",
    siteMobileAccessibility
  );

  const getAverageColor = (score) => {
    if (score >= 0.9) return "#006400";
    if (score >= 0.5) return "#b8860b";
    if (score < 0.5) return "#8b0000";
    return "black";
  };

  pdfHtmlContent += `
          <tr>
            <td colspan="3" style="color: #800080; font-weight: bold; border: 2px solid black;">Total site average Performance for Desktop 🖥️ </td>
            <td class="average-column">${getPerformancePercentageHtml_Desktop(
              avgPerformanceDesktop
            )}</td>
        </tr>
        <tr>
            <td colspan="3" style="color: #1976D2; font-weight: bold; border: 2px solid black;">Total site average Performance for Mobile 📱</td>
            <td class="average-column">${getPerformancePercentageHtml_Mobile(
              avgPerformanceMobile
            )}</td>
        </tr>
        <tr>
            <td colspan="3" style="color: #800080; font-weight: bold; border: 2px solid black;">Total site average SEO for Desktop 🖥️ </td>
            <td class="average-column" style="color: ${getAverageColor(
              avgAllSite_DesktopSEO
            )};">${getPercentage(avgAllSite_DesktopSEO)} </td>
        </tr>
        <tr>
            <td colspan="3" style="color: #1976D2; font-weight: bold; border: 2px solid black;">Total site average SEO for Mobile 📱</td>
            <td class="average-column" style="color: ${getAverageColor(
              avgAllSite_MobileSEO
            )};">${getPercentage(avgAllSite_MobileSEO)}</td>
        </tr>
        <tr>
            <td colspan="3" style="color: #800080; font-weight: bold; border: 2px solid black;">Total site average Accessibility for Desktop 🖥️ </td>
            <td class="average-column" style="color: ${getAverageColor(
              avgAllSite_DesktopAccessibility
            )};">${getPercentage(avgAllSite_DesktopAccessibility)} </td>
        </tr>
        <tr>
            <td colspan="3" style="color: #1976D2; font-weight: bold; border: 2px solid black;">Total site average Accessibility for Mobile 📱</font></td>
            <td class="average-column" style="color: ${getAverageColor(
              avgAllSite_MobileAccessibility
            )};">${getPercentage(avgAllSite_MobileAccessibility)} </td>
        </tr>
        `;

  pdfHtmlContent += `
          </tbody>
        </table>

        <!-- Analysis Section for PDF (always visible) -->
        <!-- Temporarily disabled detailed analysis section as requested -->
        <!--
        <div class="analysis-section">
          <div class="analysis-section-title">
            📊 Lighthouse Detailed Analysis
          </div>`;

  // --- Inject Analysis Data Directly (always visible in PDF) ---
  // Iterate through sortedUrls obtained from summaryData to ensure all URLs are covered
  /*
    sortedUrls.forEach(url => {
        const analysesForUrl = analysisData[url] || []; // Get the array of analyses for this specific URL

        if (analysesForUrl.length === 0) {
            pdfHtmlContent += `
                <div class="analysis-entry-block">
                    <h3>Analysis for <strong>${url}</strong>: No detailed analysis data available.</h3>
                </div>
            `;
        } else {
            analysesForUrl.forEach((entry) => { // Iterate through each runType entry for the URL
                const deviceLabel = entry.runType.charAt(0).toUpperCase() + entry.runType.slice(1);

                pdfHtmlContent += `
                    <div class="analysis-entry-block">
                        <h3>Analysis for <strong>${url}</strong> (<strong>${deviceLabel}</strong>):</h3>
                        <p><strong>Summary:</strong> ${entry.analysisSummary || 'No summary available.'}</p>
                        
                        <p><strong>Metrics:</strong> `;
                // Metrics - assuming metrics are now directly in the analysis entry
                if (entry.metrics && Object.keys(entry.metrics).length > 0) {
                    const metricDescriptions = [];
                    for (const metric in entry.metrics) {
                        metricDescriptions.push(`${metric.replace(/([A-Z])/g, ' $1').trim()}: ${getPercentage(entry.metrics[metric])}`);
                    }
                    pdfHtmlContent += metricDescriptions.join('; ') + '. ';
                } else {
                    pdfHtmlContent += 'No metrics available. ';
                }
                pdfHtmlContent += `</p>`; // End metrics paragraph

                // Issues (as a list)
                if (entry.issues && entry.issues.length > 0) {
                    pdfHtmlContent += `<p><strong>Identified Issues:</strong></p><ul class="analysis-block-list">`;
                    entry.issues.forEach(issue => {
                        let issueText = `<span class="issue-text">${issue.title || issue}</span>`; // issue might be just a string
                        if (issue.description) {
                            issueText += `: ${issue.description}`;
                        }
                        if (issue.displayValue) {
                            issueText += ` - Savings: ${issue.displayValue}`;
                        }
                        pdfHtmlContent += `<li>${issueText}</li>`;
                    });
                } else {
                    pdfHtmlContent += `<p>No issues identified.</p>`;
                }

                // Recommendations (as a list)
                if (entry.recommendations && entry.recommendations.length > 0) {
                    pdfHtmlContent += `<p><strong>Recommendations:</strong></p><ul class="analysis-block-list">`;
                    entry.recommendations.forEach(rec => {
                        let recText = `<span class="recommendation-text">${rec.title || rec}</span>`; // rec might be just a string
                        if (rec.description) {
                            recText += `: ${rec.description}`;
                        }
                        pdfHtmlContent += `<li>${recText}</li>`;
                    });
                } else {
                    pdfHtmlContent += `<p>No recommendations available.</p>`;
                }
                pdfHtmlContent += `</div>`; // Close analysis-entry-block
            });
        }
        // Add page break between different URLs' analysis sections
        pdfHtmlContent += `<hr style="page-break-after: always; visibility: hidden;">`; // Hidden HR for page break control
    });
    */
  // pdfHtmlContent += `</div>`; // Close analysis-section div
  // End of temporarily disabled detailed analysis section
  pdfHtmlContent += `
      </body>
    </html>`;

  // --- Generate the PDF using html-pdf ---
  try {
    await pdf
      .create(pdfHtmlContent, {
        format: "Letter", // Standard paper size
        orientation: "portrait", // Portrait orientation
        border: "1cm", // 1cm border on all sides
        // Additional options like header/footer can be added here if needed
        // header: {
        //   height: "15mm",
        //   contents: '<div style="text-align: center; font-size: 8pt; color: #555;">Lighthouse Report</div>'
        // },
        // footer: {
        //   height: "10mm",
        //   contents: {
        //     default: '<div style="text-align: center; font-size: 8pt; color: #555;">Page {{page}} of {{pages}}</div>',
        //   }
        // }
      })
      .toFile(pdfFilename, (err, res) => {
        if (err) {
          console.error("Error generating PDF:", err);
          return;
        }
        console.log(`PDF report generated successfully: ${res.filename}`);
      });
  } catch (error) {
    console.error("Failed to initiate PDF generation:", error);
  }
};

// Export the function so it can be imported by other files
module.exports = { generatePdfReportFromData };
