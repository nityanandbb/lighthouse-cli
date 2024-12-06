// execution.js
const { getLighthousePerformance } = require("./lighthouse-collection");
const { execSync } = require("child_process");

const executeLighthouseCLI = async (urls) => {
  try {
    console.log("Starting Lighthouse tests for all URLs...");

    // Run Lighthouse collection for both desktop and mobile in parallel
    await Promise.all([
      getLighthousePerformance(urls, "desktop"),
      getLighthousePerformance(urls, "mobile"),
    ]);

    console.log("Metrics collection completed for all form factors.");

    // Generate final HTML report
    console.log("Generating final HTML report...");
    execSync("node generateFinalHtml.js", { stdio: "inherit" });

    // Export data to CSV
    console.log("Exporting all data to CSV...");
    execSync("node exportFinalCsv.js", { stdio: "inherit" });
  } catch (error) {
    console.error("Error during Lighthouse execution:", error.message);
  }
};

module.exports = { executeLighthouseCLI };
