const fs = require("fs");

function writeToTestFile(urls) {
  const content = `const { executeLighthouseCLI } = require("./execution");

const urls = ${JSON.stringify(urls, null, 2)};

executeLighthouseCLI(urls);
`;

  fs.writeFileSync("TestURL.js", content);
  console.log(`\n📁 Written to TestURL.js with ${urls.length} URLs.`);
}

module.exports = { writeToTestFile };
