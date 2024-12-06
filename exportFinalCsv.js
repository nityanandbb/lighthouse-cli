const fs = require("fs");
const path = require("path");

// Function to read summary data from lhci-summary.json file
const getSummaryData = () => {
  const data = fs.readFileSync("lhci-summary.json", "utf8");
  return JSON.parse(data);
};

// Function to get percentage for a score
const getPercentage = (score) => {
  return (score * 100).toFixed(2) + "%";
};

// Function to calculate the average performance for each URL and group by runType
const calculatePerformanceAverage = (desktopScores, mobileScores) => {
  const desktopAverage =
    desktopScores.length > 0
      ? desktopScores.reduce((acc, score) => acc + score, 0) /
        desktopScores.length
      : 0;
  const mobileAverage =
    mobileScores.length > 0
      ? mobileScores.reduce((acc, score) => acc + score, 0) /
        mobileScores.length
      : 0;

  return {
    desktopAverage: getPercentage(desktopAverage),
    mobileAverage: getPercentage(mobileAverage),
  };
};

// Function to export the summary data to CSV in the 'results' folder
const exportToCSV = (summaryData) => {
  // Ensure the 'results' folder exists
  const resultsFolder = path.join(__dirname, "results");
  if (!fs.existsSync(resultsFolder)) {
    fs.mkdirSync(resultsFolder);
  }

  // Get the current date and time for the filename
  const now = new Date();
  const dateString = now.toISOString().replace(/[:]/g, "-"); // Replace ":" for filename compatibility

  // Construct the filename using the current date and time
  const filename = `lighthouse-metrics-${dateString}.csv`;
  const filePath = path.join(resultsFolder, filename);

  // Group by URL and runType (desktop vs mobile)
  const groupedData = summaryData.reduce((acc, entry) => {
    const url = entry.url;
    const runType = entry.runType;

    if (!acc[url]) {
      acc[url] = { desktopScores: [], mobileScores: [] };
    }

    const performanceScore = entry.categories.performance;

    if (runType === "desktop") {
      acc[url].desktopScores.push(performanceScore);
    } else if (runType === "mobile") {
      acc[url].mobileScores.push(performanceScore);
    }

    return acc;
  }, {});

  // Define the CSV header
  const csvHeader =
    "URL,Performance,SEO,Accessibility,LCP,FCP,TBT,SpeedIndex,CLS,Desktop,Mobile,Performance Average (Desktop),Performance Average (Mobile)\n";

  // Map summary data into CSV rows
  const csvRows = summaryData
    .map((entry) => {
      const { url } = entry;

      // Get performance averages for both mobile and desktop
      const desktopScores = groupedData[url]?.desktopScores || [];
      const mobileScores = groupedData[url]?.mobileScores || [];
      const { desktopAverage, mobileAverage } = calculatePerformanceAverage(
        desktopScores,
        mobileScores
      );

      // Collect the latest data for other fields (LCP, FCP, etc.)
      const lcp = entry.audits["largestContentfulPaint"] || "N/A";
      const fcp = entry.audits["firstContentfulPaint"] || "N/A";
      const tbt = entry.audits["totalBlockingTime"] || "N/A";
      const speedIndex = entry.audits["speedIndex"] || "N/A";
      const cls = entry.audits["cumulativeLayoutShift"] || "N/A";

      const seoPercentage = getPercentage(entry.categories.seo);
      const performancePercentage = getPercentage(entry.categories.performance);
      const accessibilityPercentage = getPercentage(
        entry.categories.accessibility
      );

      return `"${url}",${performancePercentage},${seoPercentage},${accessibilityPercentage},${lcp},${fcp},${tbt},${speedIndex},${cls},${
        entry.runType === "desktop" ? "Yes" : "No"
      },${
        entry.runType === "mobile" ? "Yes" : "No"
      },${desktopAverage},${mobileAverage}`;
    })
    .join("\n");

  // Combine header and rows into CSV content
  const csvContent = csvHeader + csvRows;

  // Write the CSV content to the 'results' folder
  fs.writeFileSync(filePath, csvContent, "utf8");
  console.log(`✅ CSV report generated successfully: ${filePath}`);
};

// Fetch the summary data from lhci-summary.json
const summaryData = getSummaryData();

// Export the data to CSV
exportToCSV(summaryData);
