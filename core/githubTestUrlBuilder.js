const fs = require("fs");
const { main } = require("./testUrlBuilder");

const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();

async function run() {
  let urls;

  try {
    urls = await main(mode, {
      url: baseUrl,
      selector,
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

  // Write to TestURL.js for local reuse
  fs.writeFileSync(
    "TestURL.js",
    `process.env.TESTFILES_LIST = "${finalURLs.join(" ")}";\n`
  );

  console.log(`📁 Written to TestURL.js with ${finalURLs.length} URLs.`);
}

run();
