const { main } = require("./core/testUrlBuilder");

const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();
const rawText = process.env.RAW_TEXT?.trim(); // For mode 4
const filePath = "./testUrl.js"; // This will be used by `main` internally

(async () => {
  try {
    const options = {};

    if (baseUrl) options.url = baseUrl;
    if (selector) options.selector = selector;
    if (rawText) options.rawText = rawText;

    await main(mode, options, filePath); // let main() handle file creation

    console.log(`✅ githubTestUrlBuilder completed for mode ${mode}`);
  } catch (error) {
    console.error("❌ Error in githubTestUrlBuilder:", error);
    process.exit(1);
  }
})();
 