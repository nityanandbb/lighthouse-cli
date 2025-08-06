// core/testUrlBuilder.js
const { extractWithHoverAndClick } = require("../extractors/hoverAndClick");

const { extractUsingCssSelector } = require("../extractors/cssSelectorMode");
const {
  extractUsingXPathSelector,
} = require("../extractors/xpathSelectorMode");
const { extractFromRawUrlList } = require("../extractors/rawListMode");
const { extractAllHrefLinks } = require("../extractors/allAnchorLinksMode");

function main(mode, options) {
  switch (mode) {
    case 1:
      return extractWithHoverAndClick(options.url);

    case 2:
      return extractUsingCssSelector(options.url, options.selector);

    case 3:
      return extractUsingXPathSelector(options.url, options.selector);

    case 4:
      return extractFromRawUrlList(options.rawInput);

    case 5:
      return extractAllHrefLinks(options.url);

    default:
      console.error("❌ Invalid mode. Use 1, 2, 3, 4 or 5.");
  }
}

module.exports = {
  main,
};
