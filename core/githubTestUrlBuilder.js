const fs = require("fs");
const { main } = require("./testUrlBuilder");

const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();
const rawInput = process.env.RAW_URLS?.trim();

async function run() {
  let urls;

  try {
    urls = await main(mode, {
      url: baseUrl,
      selector,
      rawInput,
    });
  } catch (err) {
    console.error("❌ Error running extractor function:", err);
    process.exit(1);
  }

  if (!Array.isArray(urls)) {
    console.error("❌ Extractor did not return an array.");
    process.exit(1);
  }

  // Clean up and deduplicate URLs
  const finalURLs = Array.from(
    new Set(urls.map((u) => u.trim().replace(/\/$/, "")))
  ).filter(Boolean);

  // Write to JS file for local testing
  fs.writeFileSync(
    "TestURL.js",
    `process.env.TESTFILES_LIST = "${finalURLs.join(" ")}";\n`
  );
  console.log(`📁 Written to TestURL.js with ${finalURLs.length} URLs.`);

  // Export to GitHub Actions env
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(
      process.env.GITHUB_ENV,
      `TESTFILES_LIST=${finalURLs.join(" ")}\n`
    );
    console.log("🔁 Exported TESTFILES_LIST to GitHub ENV.");
  }
}

run();
