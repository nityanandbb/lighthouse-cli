// core/githubTestUrlBuilder.js
const fs = require("fs");
const { main } = require("./testUrlBuilder");

// Read mode and input from environment variables
const mode = parseInt(process.env.MODE, 10);
const url = process.env.URL;
const selector = process.env.SELECTOR || "";
const rawInput = process.env.RAW_INPUT || "";

// Call main extractor function
const urls = main(mode, { url, selector, rawInput });

// Deduplicate and trim URLs
const linkSet = new Set(urls.map((u) => u.trim().replace(/\/$/, "")));
const finalURLs = [...linkSet];

// Save locally for reference/debugging
fs.writeFileSync(
  "TestURL.js",
  `process.env.TESTFILES_LIST = "${finalURLs.join(" ")}";`
);
console.log(`📁 Written to TestURL.js with ${finalURLs.length} URLs.`);

// Export to GitHub Actions environment
if (process.env.GITHUB_ENV) {
  fs.appendFileSync(
    process.env.GITHUB_ENV,
    `TESTFILES_LIST=${finalURLs.join(" ")}\n`
  );
  console.log("✅ TESTFILES_LIST exported to GitHub Actions environment.");
} else {
  console.warn("⚠️ GITHUB_ENV not found. Skipping environment export.");
}
