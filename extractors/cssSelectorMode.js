// extractors/cssSelectorMode.js
const puppeteer = require("puppeteer");
const { writeToTestFile } = require("../core/utils/writeToTestFile");
const { cleanAndFilterLinks } = require("../core/utils/cleanLinks");

async function extractUsingCssSelector(baseUrl, selector) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle2" });

  const links = await page.$$eval(selector, (els) =>
    els.map((el) => el.getAttribute("href")).filter(Boolean)
  );

  await browser.close();

  const cleaned = cleanAndFilterLinks(links, baseUrl);

  console.log(`✅ Found ${cleaned.length} links using selector: ${selector}`);
  writeToTestFile(cleaned);
}

module.exports = {
  extractUsingCssSelector,
};
