// core/githubTestUrlBuilder.js
const fs = require("fs");
const path = require("path");
const { main } = require("./testUrlBuilder");

const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();
const rawInputPath = process.env.RAW_INPUT?.trim();

async function run() {
  try {
    let options = {};

    switch (mode) {
      case 1:
      case 5:
        if (!baseUrl) throw new Error("BASE_URL is required for mode " + mode);
        options.url = baseUrl;
        break;

      case 2:
      case 3:
        if (!baseUrl || !selector) {
          throw new Error(
            "BASE_URL and SELECTOR are required for mode " + mode
          );
        }
        options.url = baseUrl;
        options.selector = selector;
        break;

      case 4:
        if (!rawInputPath)
          throw new Error("RAW_INPUT path required for mode 4");
        const fullPath = path.resolve(rawInputPath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`RAW_INPUT file not found at: ${fullPath}`);
        }

        const rawLines = fs
          .readFileSync(fullPath, "utf-8")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        options.rawInput = rawLines;
        break;

      default:
        throw new Error("Invalid MODE. Must be 1 to 5.");
    }

    await main(mode, options); // You can ignore return value
    console.log("✅ Extractor completed successfully.");
  } catch (err) {
    console.error("🔥 Error in githubTestUrlBuilder:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
