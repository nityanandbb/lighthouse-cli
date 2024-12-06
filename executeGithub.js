// executeGithub.js
const { executeLighthouseCLI } = require("./execution");

// Fetch URLs from environment variables
const urlsEnv = process.env.TESTFILES_LIST;

// Validate input
if (!urlsEnv) {
  console.error(
    "❌ No URLs provided. Please ensure TESTFILES_LIST is set in the environment variables."
  );
  process.exit(1);
}

// Convert the space-separated list of URLs into an array
const urls = urlsEnv.split(" ").filter(Boolean);

// Log each URL being processed
console.log("🔍 URLs to be tested:");
urls.forEach((url, index) => {
  console.log(`  ${index + 1}. ${url}`);
});

// Execute Lighthouse CLI with the provided URLs
(async () => {
  try {
    console.log("🚀 Starting Lighthouse tests...");
    await executeLighthouseCLI(urls);
    console.log("✅ Lighthouse tests completed.");
  } catch (error) {
    console.error(
      "🔥 An error occurred while executing Lighthouse tests:",
      error
    );
    process.exit(1);
  }
})();
