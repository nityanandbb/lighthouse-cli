const fs = require("fs");
const { execSync } = require("child_process");
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

// Function to run processConfig.js
const runProcessConfig = () => {
  try {
    execSync("node processConfig.js", { stdio: "inherit" });
  } catch (error) {
    console.error("Error running processConfig.js:", error);
    process.exit(1);
  }
};

// F

// Function to read the project configuration from githubconfigsFile.json
const getConfigData = () => {
  const data = fs.readFileSync("githubconfigsFile.json", "utf8");
  return JSON.parse(data);
};


// Function to generate HTML report with dynamic filename (date + time)
const generateFinalHTMLReport = (summaryData, configData) => {
  // Get the current date and time for the filename
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-"); // Replace ":" to avoid issues in filenames
  const filename = `lighthouse-metrics-report-${dateString}.html`;

  // Function to apply color based on pass/fail
  const getPassFailColor = (score) => {
    if (score >= 0.9) return "green"; // Pass
    if (score < 0.9) return "red"; // Fail
    return "gray"; // Undefined
  };

  // Function to get percentage from performance and accessibility
  const getPercentage = (score) => {
    return (score * 100).toFixed(0) + "%";
  };

  // Group data by URL and calculate average performance and SEO separately for Desktop and Mobile
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

  // Sort the URLs alphabetically
  const sortedUrls = Object.keys(groupedData).sort();

  let htmlContent = `
    <html>
      <head>
        <title>Lighthouse Metrics Report</title>
        <style>
          table { 
            width: 100%; 
            border-collapse: collapse; 
            overflow-y: auto; 
            display: block; 
          }
          th, td { 
            padding: 8px; 
            text-align: left; 
            border: 1px solid #ddd; 
          }
          th { 
            background-color: #f2f2f2;
            position: sticky;
            top: 0;
            z-index: 1;
          }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:nth-child(odd) { background-color: #fff; }
          .desktop { background-color: #d4edda; }
          .mobile { background-color: #f8d7da; }
          .pass { color: green; }
          .fail { color: red; }
          .highlight {
            background-color: #f0ad4e; /* Highlighted Rows (light orange) */
          }
          .average-column {
            background-color: #e9ecef; /* Light gray background for average column */
            font-weight: bold;
            color: #343a40;
            border: 2px solid black; /* Black border only for average column */
          }
          .average-row {
            border: 2px solid black; /* Black border for rows */
          }
        </style>
      </head>
      <body>
        <div>
          <img src="data:image/jpeg;base64,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" alt="Logo" style="float:left; width: 200px; height: 100px;">
          <p style="text-align: right;"> QED42 Engineering Pvt. Ltd.</p>
           
          <h1 style="text-align: center;"> Lighthouse Metrics Report</h1> </p>

          
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
          
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Performance</th>
                <th class="average-column">Average Performance</th>
                <th>SEO</th>
                <th class="average-column">Average SEO</th>
                <th>Accessibility</th>
                <th>Desktop</th>
                <th>Mobile</th>
                <th>Largest Contentful Paint</th>
                <th>First Contentful Paint</th>
                <th>Total Blocking Time</th>
                <th>Cumulative Layout Shift</th>
                <th>Speed Index</th>
              </tr>
            </thead>
            <tbody>`;

  // Loop through each URL and add rows to the table
  sortedUrls.forEach((url) => {
    const entries = groupedData[url];

    // Calculate average performance for Desktop
    const desktopTotalPerformance = entries.desktop.reduce(
      (acc, entry) => acc + entry.categories.performance,
      0
    );
    const desktopAverage =
      entries.desktop.length > 0
        ? (desktopTotalPerformance / entries.desktop.length).toFixed(2)
        : 0;

    // Calculate average performance for Mobile
    const mobileTotalPerformance = entries.mobile.reduce(
      (acc, entry) => acc + entry.categories.performance,
      0
    );
    const mobileAverage =
      entries.mobile.length > 0
        ? (mobileTotalPerformance / entries.mobile.length).toFixed(2)
        : 0;

    // Calculate average SEO for Desktop
    const desktopTotalSEO = entries.desktop.reduce(
      (acc, entry) => acc + entry.categories.seo,
      0
    );
    const desktopSEO =
      entries.desktop.length > 0
        ? (desktopTotalSEO / entries.desktop.length).toFixed(2)
        : 0;

    // Calculate average SEO for Mobile
    const mobileTotalSEO = entries.mobile.reduce(
      (acc, entry) => acc + entry.categories.seo,
      0
    );
    const mobileSEO =
      entries.mobile.length > 0
        ? (mobileTotalSEO / entries.mobile.length).toFixed(2)
        : 0;

    // Add rows for Desktop
    entries.desktop.forEach((entry) => {
      const performanceColor = getPassFailColor(entry.categories.performance);
      const seoColor = getPassFailColor(entry.categories.seo);

      htmlContent += `
        <tr class="desktop highlight average-row">
          <td>${entry.url}</td>
          <td class="pass" style="color: ${performanceColor};">${getPercentage(
        entry.categories.performance
      )}</td>
          <td class="average-column">${getPercentage(desktopAverage)}</td>
          <td class="pass" style="color: ${seoColor};">${getPercentage(
        entry.categories.seo
      )}</td>
          <td class="average-column">${getPercentage(desktopSEO)}</td>
          <td class="pass" style="color: ${performanceColor};">${getPercentage(
        entry.categories.accessibility
      )}</td>
          <td>${entry.runType === "desktop" ? "✔️" : "❌"}</td>
          <td>${entry.runType === "mobile" ? "✔️" : "❌"}</td>
          <td>${entry.audits.largestContentfulPaint}</td>
          <td>${entry.audits.firstContentfulPaint}</td>
          <td>${entry.audits.totalBlockingTime}</td>
          <td>${entry.audits.cumulativeLayoutShift}</td>
          <td>${entry.audits.speedIndex}</td>
        </tr>`;
    });

    // Add rows for Mobile
    entries.mobile.forEach((entry) => {
      const performanceColor = getPassFailColor(entry.categories.performance);
      const seoColor = getPassFailColor(entry.categories.seo);

      htmlContent += `
        <tr class="mobile highlight average-row">
          <td>${entry.url}</td>
          <td class="pass" style="color: ${performanceColor};">${getPercentage(
        entry.categories.performance
      )}</td>
          <td class="average-column">${getPercentage(mobileAverage)}</td>
          <td class="pass" style="color: ${seoColor};">${getPercentage(
        entry.categories.seo
      )}</td>
          <td class="average-column">${getPercentage(mobileSEO)}</td>
          <td class="pass" style="color: ${performanceColor};">${getPercentage(
        entry.categories.accessibility
      )}</td>
          <td>${entry.runType === "desktop" ? "✔️" : "❌"}</td>
          <td>${entry.runType === "mobile" ? "✔️" : "❌"}</td>
          <td>${entry.audits.largestContentfulPaint}</td>
          <td>${entry.audits.firstContentfulPaint}</td>
          <td>${entry.audits.totalBlockingTime}</td>
          <td>${entry.audits.cumulativeLayoutShift}</td>
          <td>${entry.audits.speedIndex}</td>
        </tr>`;
    });
  });

  // Close the table and HTML tags
  htmlContent += `
          </tbody>
        </table>
      </body>
    </html>`;

  // Save the generated report as an HTML file
  fs.writeFileSync(filename, htmlContent);

  console.log(`Report saved as ${filename}`);
};

// Get data and generate report
runProcessConfig();
const summaryData = getSummaryData();
const configData = getConfigData();
generateFinalHTMLReport(summaryData, configData);
 