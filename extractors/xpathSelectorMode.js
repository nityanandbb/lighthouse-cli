// extractors/xpathSelectorMode.js
const puppeteer = require("puppeteer");
const { writeToTestFile } = require("../core/utils/writeToTestFile");
const { cleanAndFilterLinks } = require("../core/utils/cleanLinks");

async function extractUsingXPathSelector(baseUrl, xpathSelector) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle2" });

  const elements = await page.$x(xpathSelector);
  const hrefs = [];
  for (const el of elements) {
    try {
      const prop = await el.getProperty("href");
      const href = await prop.jsonValue();
      if (href) hrefs.push(href);
    } catch {
      // Optional: Log the error if needed
    }
  }

  await browser.close();

  const cleaned = cleanAndFilterLinks(hrefs, baseUrl);
  console.log(`✅ Found ${cleaned.length} links using XPath: ${xpathSelector}`);
  writeToTestFile(cleaned);

  // ✅ Return cleaned links
  return cleaned;
}

module.exports = {
  extractUsingXPathSelector,
};
