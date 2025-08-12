// tools/sitemap/lib/writer.js

const fs = require("fs/promises");

async function writeTestFile(outPath, urls) {
  const content = `exports.urls = ${JSON.stringify(urls, null, 2)};\n`;
  await fs.writeFile(outPath, content, "utf8");
}

module.exports = { writeTestFile };
