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

    // ✅ Check again here
    if (!Array.isArray(urls)) {
      throw new Error("Extractor did not return an array.");
    }
  } catch (err) {
    console.error("❌ Error in main() or extractor:", err);
    process.exit(1);
  }

  const finalURLs = Array.from(
    new Set(urls.map((u) => u.trim().replace(/\/$/, "")))
  ).filter(Boolean);

  fs.writeFileSync(
    "TestURL.js",
    `exports.urls = ${JSON.stringify(finalURLs, null, 2)};\n`
  );

  console.log(`📁 Written to TestURL.js with ${finalURLs.length} URLs.`);
}

run();
