// extractors/predefinedExtractor.js
const { writeToTestFile } = require("../core/utils/writeToTestFile");
const { cleanAndFilterLinks } = require("../core/utils/cleanLinks");
const advSelectors = require("../core/utils/advSelectors");

async function extractUsingPredefinedSelectors(page, baseUrl) {
  baseUrl = baseUrl.trim().replace(/\/$/, "");
  const baseOrigin = new URL(baseUrl).origin;

  const selectors = [
    "header nav a",
    "nav ul > li > a",
    ".navbar-nav .nav-item > .nav-link",
    ".nav-item.dropdown > .nav-link",
    ".dropdown-menu a",
    ".dropdown-content a",
    ".main-nav a",
    ".nav-menu a",
    ".menu-item > a",
    ".mega-menu a",
    ".has-megamenu > a",
    "ul.menu.sf-menu li a",
  ];

  const linkSet = new Set();

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 1500 });
      const elements = await page.$$(selector);

      for (const el of elements) {
        const box = await el.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          (await page.waitForTimeout?.(300)) ??
            new Promise((r) => setTimeout(r, 300));
        }
      }

      const rawLinks = await page.$$eval(selector, (els) =>
        els
          .filter((el) => el.offsetParent !== null)
          .map((el) => el.getAttribute("href"))
          .filter(
            (href) =>
              href && !href.startsWith("javascript:") && !href.startsWith("#")
          )
      );

      rawLinks.forEach((href) => {
        try {
          const fullUrl = new URL(href, baseOrigin).href;
          if (fullUrl.startsWith(baseOrigin)) linkSet.add(fullUrl);
        } catch {}
      });
    } catch (e) {
      console.warn(`⚠️ Selector failed: ${selector} → ${e.message}`);
    }
  }

  // Fallback: use advSelectors if links are few
  if (linkSet.size <= 6) {
    console.log("🔁 Fallback: Trying advanced selectors...");
    for (const adv of advSelectors) {
      try {
        await page.waitForSelector(adv, { timeout: 1500 });
        const links = await page.$$eval(adv, (els) =>
          els
            .filter((el) => el.offsetParent !== null)
            .map((el) => el.getAttribute("href"))
            .filter(
              (href) =>
                href && !href.startsWith("javascript:") && !href.startsWith("#")
            )
        );
        links.forEach((href) => {
          try {
            const fullUrl = new URL(href, baseOrigin).href;
            if (fullUrl.startsWith(baseOrigin)) linkSet.add(fullUrl);
          } catch {}
        });
      } catch (e) {
        console.warn(`⚠️ Adv selector failed: ${adv} → ${e.message}`);
      }
    }
  }

  linkSet.add(baseUrl);

  const finalLinks = [...linkSet];
  console.log(
    `✅ Found ${finalLinks.length} links using predefined selectors.`
  );
  finalLinks.forEach((link) => console.log("  ➤", link));

  writeToTestFile(finalLinks);

  return finalLinks; // ✅ Critical fix
}

module.exports = {
  extractUsingPredefinedSelectors,
};
