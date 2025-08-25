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

    // 🔥 Run AI analysis (uses OPENAI_API_KEY from env)
    console.log("☘🔥🔥🔥🔥Running AI site analysis... 🔥🔥🔥");
    execSync("npm run analysis:human", { stdio: "inherit" });

    // Generate final HTML report
    console.log("🔥🔥🔥 Generating final HTML report...🔥🔥🔥");
    execSync("node generateFinalHtmlReport_avg_analysis_v13.js", {
      stdio: "inherit",
    });

    // Export data to CSV
    console.log("🔥🔥🔥🔥Exporting all data to CSV... 🔥🔥🔥");
    execSync("node exportFinalCsv.js", { stdio: "inherit" });
  } catch (error) {
    console.error("Error during Lighthouse execution:", error.message);
  }
};

module.exports = { executeLighthouseCLI };
 