const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

async function getLighthousePerformance(urls, formFactor) {
  console.log(`Starting Lighthouse metrics collection for ${formFactor}...`);

  // Path for .lighthouserc.json
  const lighthouseConfigPath = "./.lighthouserc.json";

  // Create an array to store performance metrics for all URLs
  const allPerformanceMetrics = [];

  // Iterate through each URL to perform the Lighthouse collection
  for (const url of urls) {
    console.log(`Running Lighthouse for URL: ${url} on ${formFactor}`);

    try {
      // Check if the .lighthouserc.json file exists for the form factor
      if (formFactor === "mobile") {
        // If it's mobile, delete the .lighthouserc.json file
        if (fs.existsSync(lighthouseConfigPath)) {
          fs.unlinkSync(lighthouseConfigPath);
          console.log(`Deleted ${lighthouseConfigPath} for mobile.`);
        }
      } else if (formFactor === "desktop") {
        // If it's desktop, create the .lighthouserc.json file with desktop-specific config
        if (!fs.existsSync(lighthouseConfigPath)) {
          const config = {
            ci: {
              collect: {
                settings: {
                  preset: "desktop",
                },
              },
              assert: {
                preset: "lighthouse:recommended",
                budget: {
                  performance: 0.9,
                  accessibility: 0.9,
                },
              },
              upload: {
                target: "filesystem",
                outputDir: "./lhci-reports",
              },
            },
          };

          fs.writeFileSync(
            lighthouseConfigPath,
            JSON.stringify(config, null, 2),
            "utf8"
          );
          console.log(`Created ${lighthouseConfigPath} for desktop.`);
        }
      }

      // Ensure the directory for reports exists
      const reportPath = "./.lighthouseci";
      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
        console.log(`Created directory for Lighthouse reports: ${reportPath}`);
      }

      // Run Lighthouse collection for the current URL
      execSync(
        `npx lhci collect --additive --url="${url}" --emulatedFormFactor=${formFactor} --preset=${formFactor} --outputDir=${reportPath}`,
        { stdio: "inherit" }
      );
      console.log(`Lighthouse collection completed for ${url}`);

      // Process the collected data (e.g., extract performance metrics, etc.)
      const metrics = await processLighthouseReport(reportPath, url);
      // Store the performance metrics for this URL
      allPerformanceMetrics.push(metrics);
    } catch (error) {
      console.error(
        `Error processing URL: ${url} on ${formFactor}`,
        error.message
      );
    }
  }

  // Once all URLs are processed, call extract-data.js to append the metrics
  console.log("All URLs processed. Now appending metrics to summary file...");
  execSync("node extract-data.js", { stdio: "inherit" });
  console.log(`Metrics for all URLs added to summary file.`);
}

async function processLighthouseReport(reportPath, url) {
  console.log("Lighthouse execution completed. Collecting metrics...");

  const performanceMetrics = {
    timestamp: new Date().toISOString(),
    categories: {}, // Scores (e.g., performance, accessibility)
    audits: {}, // Metrics details
  };

  // Add delay to ensure report generation completes
  console.log("Waiting for Lighthouse to finish writing reports...");
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Add a 2-second delay

  // Dynamically read the Lighthouse report (find the latest report file)
  const reportFiles = fs
    .readdirSync(reportPath)
    .filter((file) => file.endsWith(".json"));

  if (reportFiles.length === 0) {
    throw new Error("No Lighthouse report file found.");
  }

  // Assuming the latest report is the last one in the array
  const latestReportFile = reportFiles[reportFiles.length - 1];
  console.log(`Found Lighthouse report: ${latestReportFile}`);

  const rawData = fs.readFileSync(
    path.join(reportPath, latestReportFile),
    "utf8"
  );
  const report = JSON.parse(rawData);

  // Extract performance categories and audits
  performanceMetrics.categories = Object.entries(report.categories).reduce(
    (acc, [key, value]) => {
      acc[key] = { title: value.title, score: value.score };
      return acc;
    },
    {}
  );

  performanceMetrics.audits = {
    largestContentfulPaint:
      report.audits["largest-contentful-paint"].displayValue,
    firstContentfulPaint: report.audits["first-contentful-paint"].displayValue,
    cumulativeLayoutShift:
      report.audits["cumulative-layout-shift"].displayValue,
    speedIndex: report.audits["speed-index"].displayValue,
  };

  // Log the performance metrics
  console.log("Performance Metrics:");
  console.log(JSON.stringify(performanceMetrics, null, 2));

  // Write metrics to a JSON file (this is for individual URL processing)
  const metricsFilePath = `./metrics_${url.replace(/[^\w\s]/gi, "")}.json`;
  fs.writeFileSync(
    metricsFilePath,
    JSON.stringify(performanceMetrics, null, 2),
    "utf8"
  );

  console.log(`Metrics logged successfully to ${metricsFilePath}`);

  // Return the metrics object so it can be appended at the end
  return performanceMetrics;
}

module.exports = { getLighthousePerformance };
