// extractors/rawListMode.js
const { writeToTestFile } = require("../core/utils/writeToTestFile");

function extractFromRawUrlList(rawInput) {
  const split = rawInput
    .split(/\s+/)
    .map((url) => url.trim())
    .filter(Boolean)
    .filter((url) => url.startsWith("http"));

  const unique = [...new Set(split)];

  console.log(`✅ Parsed ${unique.length} URLs from raw input.`);
  unique.forEach((link) => console.log("  ➤", link));

  writeToTestFile(unique);
}

module.exports = {
  extractFromRawUrlList,
};
