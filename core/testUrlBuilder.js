// core/testUrlBuilder.js
const { extractWithHoverAndClick } = require("../extractors/hoverAndClick");

const { extractUsingCssSelector } = require("../extractors/cssSelectorMode");
const {
  extractUsingXPathSelector,
} = require("../extractors/xpathSelectorMode");
const { extractFromRawUrlList } = require("../extractors/rawListMode");
const { extractAllHrefLinks } = require("../extractors/allAnchorLinksMode");

async function main(mode, options) {
  try {
    switch (mode) {
      case 1:
        return await extractWithHoverAndClick(options.url);

      case 2:
        return await extractUsingCssSelector(options.url, options.selector);

      case 3:
        return await extractUsingXPathSelector(options.url, options.selector);

      case 4:
        return await extractFromRawUrlList(options.rawInput);

      case 5:
        return await extractAllHrefLinks(options.url);

      default:
        console.error("❌ Invalid mode. Use 1, 2, 3, 4 or 5.");
        return [];
    }
  } catch (err) {
    console.error("❌ Error inside main():", err);
    return [];
  }
}

module.exports = {
  main,
};
