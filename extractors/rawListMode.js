// extractors/rawListMode.js
const { writeToTestFile } = require("../core/utils/writeToTestFile");

function normalizeUrl(url) {
  return url.replace(/\/+$/, ""); // Remove trailing slashes
}

function extractFromRawUrlList(rawInput) {
  if (typeof rawInput !== "string" || rawInput.trim() === "") {
    console.warn("⚠️ No raw input provided or input is not a valid string.");
    return;
  }

  const split = rawInput
    .split(/\s+/)
    .map((url) => url.trim())
    .filter(Boolean)
    .filter((url) => url.startsWith("http"));

  const unique = [...new Set(split.map(normalizeUrl))];

  console.log(`✅ Parsed ${unique.length} URLs from raw input.`);
  unique.forEach((link) => console.log("  ➤", link));

  writeToTestFile(unique);
  return unique;
}

module.exports = {
  extractFromRawUrlList,
};
