// core/utils/pageInteractions.js
async function performClickAndHover(page) {
  const clickSelectors = [
    ".menu-toggle",
    ".nav-toggle",
    ".dropdown-toggle",
    "button[aria-haspopup]",
    'button[aria-expanded="false"]',
    ".mobile-menu-button",
    ".hamburger",
  ];

  for (const selector of clickSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        (await page.waitForTimeout?.(500)) ??
          new Promise((r) => setTimeout(r, 500));
      }
    } catch (e) {
      console.warn(`⚠️ Click failed on ${selector}: ${e.message}`);
    }
  }

  const navItems = await page.$$("nav li, .nav-item, .menu-item, .dropdown");
  for (const item of navItems) {
    try {
      await item.hover();
      (await page.waitForTimeout?.(200)) ??
        new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.warn(`⚠️ Hover failed: ${e.message}`);
    }
  }
}

module.exports = {
  performClickAndHover,
};
