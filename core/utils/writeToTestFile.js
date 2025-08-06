const fs = require("fs");
const path = require("path");

function writeToTestFile(links) {
  const filePath = path.join(__dirname, "../../TestURL.js");

  // Deduplicate and filter valid URLs
  const uniqueLinks = [
    ...new Set(
      links.filter(Boolean).map((link) => link.trim().replace(/\/$/, ""))
    ),
  ];

  // Write the links as a JavaScript array export
  const content = `exports.urls = ${JSON.stringify(uniqueLinks, null, 2)};\n`;

  fs.writeFileSync(filePath, content);
  console.log(`📁 Written to TestURL.js with ${uniqueLinks.length} URLs.`);
}

module.exports = {
  writeToTestFile,
};
