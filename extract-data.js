const fs = require("fs");
const path = require("path");

console.log("Starting Lighthouse metrics extraction...");

(async () => {
  try {
    const lighthouseDir = ".lighthouseci"; // Path to Lighthouse report directory
    const summaryFilePath = "./lhci-summary.json";

    // Clear the summary file at the start of the script
    console.log(`Clearing previous data in ${summaryFilePath}...`);
    fs.writeFileSync(summaryFilePath, JSON.stringify([], null, 2), "utf8");

    const jsonFiles = fs
      .readdirSync(lighthouseDir)
      .filter((file) => file.endsWith(".json")); // Filter JSON report files

    if (jsonFiles.length === 0) {
      throw new Error("No JSON Lighthouse reports found in .lighthouseci/.");
    }

    console.log(
      `Found ${jsonFiles.length} JSON report(s). Extracting metrics...`
    );

    // Extract metrics from each JSON file
    const metricsSummary = jsonFiles.map((file) => {
      const filePath = path.join(lighthouseDir, file);
      const rawData = fs.readFileSync(filePath, "utf8");
      let report;

      try {
        report = JSON.parse(rawData);
      } catch (error) {
        console.error(`Error parsing JSON in file ${file}:`, error.message);
        return null; // Skip this report if JSON parsing fails
      }

      // Extract type of run (desktop or mobile)
      const runType = report.configSettings?.formFactor || "unknown";
      const requestedUrl = report.requestedUrl || "unknown";
      const performanceScore = report.categories?.performance?.score ?? 0;
      const accessibilityScore = report.categories?.accessibility?.score ?? 0;
      const seoScore = report.categories?.seo?.score ?? 0;

      // Extract the audits
      return {
        reportFile: file,
        timestamp: new Date().toISOString(),
        url: requestedUrl,
        runType: runType,
        categories: {
          performance: performanceScore,
          accessibility: accessibilityScore,
          seo: seoScore,
        },
        audits: {
          largestContentfulPaint:
            report.audits["largest-contentful-paint"]?.displayValue || "N/A",
          firstContentfulPaint:
            report.audits["first-contentful-paint"]?.displayValue || "N/A",
          totalBlockingTime:
            report.audits["total-blocking-time"]?.displayValue || "N/A",
          cumulativeLayoutShift:
            report.audits["cumulative-layout-shift"]?.displayValue || "N/A",
          speedIndex: report.audits["speed-index"]?.displayValue || "N/A",
        },
      };
    });

    // Filter out null (failed to parse) entries
    const validMetrics = metricsSummary.filter(Boolean);

    // Write all extracted metrics to the summary file
    fs.writeFileSync(
      summaryFilePath,
      JSON.stringify(validMetrics, null, 2),
      "utf8"
    );

    console.log(
      `Metrics extracted and saved to ${summaryFilePath}. Total entries: ${validMetrics.length}`
    );

    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
  } catch (error) {
    console.error(
      "Error occurred during Lighthouse metrics extraction:",
      error.message
    );
  }
})();
