// core/githubTestUrlBuilder.js
const fs = require("fs");
const path = require("path");
const { main } = require("./testUrlBuilder");

const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();

async function run() {
  let urls;

  try {
    urls = await main(mode, { url: baseUrl, selector });

    if (!Array.isArray(urls)) {
      console.error("❌ Extractor did not return an array. Got:", urls);
      throw new Error("Extractor did not return an array.");
    }

    const finalURLs = [
      ...new Set(urls.map((u) => u.trim().replace(/\/$/, ""))),
    ].filter(Boolean);

    const filePath = path.resolve(process.cwd(), "TestURL.js");
    console.log(`\x1b[1;34m🧪 Writing TestURL.js to:\x1b[0m ${filePath}`);


    const fileContent = `exports.urls = ${JSON.stringify(
      finalURLs,
      null,
      2
    )};\n`;
    fs.writeFileSync(filePath, fileContent);

    console.log("✅ File written successfully.");
    console.log("📄 Contents:\n", fileContent);
  } catch (err) {
    console.error("❌ Error in main() or extractor:", err.message);
    console.error(err.stack);
    process.exit(1); // still exit, but with better logs
  }
}

run();
