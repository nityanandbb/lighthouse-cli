// core/githubTestUrlBuilder.js
const fs = require("fs");
const path = require("path");
const { main } = require("./testUrlBuilder");

const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();

const OUTPUT_FILE = path.resolve(__dirname, "../TestURL.js"); // ✅ writing to root

async function run() {
  let urls;

  try {
    urls = await main(mode, { url: baseUrl, selector });

    if (!Array.isArray(urls)) {
      throw new Error("Extractor did not return an array.");
    }
  } catch (err) {
    console.error("❌ Error in main() or extractor:", err);
    process.exit(1);
  }

  const finalURLs = [
    ...new Set(urls.map((u) => u.trim().replace(/\/$/, ""))),
  ].filter(Boolean);

  const filePath = path.resolve(__dirname, "../TestURL.js");

  fs.writeFileSync(
    filePath,
    `exports.urls = ${JSON.stringify(finalURLs, null, 2)};\n`
  );

  console.log(`📁 Written to TestURL.js with ${finalURLs.length} URLs.`);
  console.log(`🗂️  File location: ${filePath}`);
  console.log(`📁 Written to ${OUTPUT_FILE} with ${finalURLs.length} URLs.`);
}

run();
