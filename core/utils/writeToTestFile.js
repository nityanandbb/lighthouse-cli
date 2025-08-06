const fs = require("fs");
const path = require("path");

function writeToTestFile(links) {
  const filePath = path.join(__dirname, "../../TestURL.js");

  // Deduplicate and filter valid URLs
  const uniqueLinks = [...new Set(links.filter(Boolean))];

  // Join them as space-separated string
  const content = `process.env.TESTFILES_LIST = "${uniqueLinks.join(" ")}";\n`;

  fs.writeFileSync(filePath, content);
  console.log(`📁 Written to TestURL.js with ${uniqueLinks.length} URLs.`);
}

module.exports = {
  writeToTestFile,
};
