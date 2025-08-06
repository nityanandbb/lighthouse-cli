// runLighthouseAuto.js

// ✅ This file loads URLs from TestURL.js and runs Lighthouse using those URLs
const { urls } = require("./TestURL.js");
const { executeLighthouseCLI } = require("./execution");

if (!urls || !Array.isArray(urls) || urls.length === 0) {
  console.error(
    "❌ No URLs found. Make sure TestURL.js exports a valid `urls` array."
  );
  process.exit(1);
}

console.log("🔍 URLs to be tested:");
urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));

(async () => {
  try {
    console.log("🚀 Starting Lighthouse tests...");
    await executeLighthouseCLI(urls);
    console.log("✅ Lighthouse tests completed.");
  } catch (error) {
    console.error("🔥 Lighthouse failed:", error);
    process.exit(1);
  }
})();
