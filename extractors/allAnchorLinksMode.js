// extractors/allAnchorLinksMode.js
const puppeteer = require("puppeteer");
const { writeToTestFile } = require("../core/utils/writeToTestFile");
const { cleanAndFilterLinks } = require("../core/utils/cleanLinks");

async function extractAllHrefLinks(baseUrl) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle2" });

  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .map((a) => a.getAttribute("href"))
      .filter(Boolean);
  });

  await browser.close();

  const cleaned = cleanAndFilterLinks(allLinks, baseUrl);

  console.log(
    `✅ Extracted ${cleaned.length} valid <a href> URLs from: ${baseUrl}`
  );
  cleaned.forEach((link) => console.log("  ➤", link));

  writeToTestFile(cleaned);
}

module.exports = {
  extractAllHrefLinks,
};
