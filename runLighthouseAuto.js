// Load URLs from TestURL.js (sets process.env.TESTFILES_LIST)
require("./TestURL.js");

const { executeLighthouseCLI } = require("./execution");

// Get URLs
const urlsEnv = process.env.TESTFILES_LIST;

if (!urlsEnv) {
  console.error(
    "❌ TESTFILES_LIST is empty or missing. Run mode 1, 2, 3, or 5 first."
  );
  process.exit(1);
}

const urls = urlsEnv.split(" ").filter(Boolean);

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
