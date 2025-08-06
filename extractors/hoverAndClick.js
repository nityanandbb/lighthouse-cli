// extractors/hoverAndClick.js
const puppeteer = require("puppeteer");
const { extractUsingPredefinedSelectors } = require("./predefinedExtractor");
const { performClickAndHover } = require("../core/utils/pageInteractions");

async function extractWithHoverAndClick(baseUrl) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  await page.goto(baseUrl, { waitUntil: "networkidle2" });

  await performClickAndHover(page);
  await extractUsingPredefinedSelectors(page, baseUrl);

  await browser.close();
}

module.exports = {
  extractWithHoverAndClick,
};
