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
    let result;

    console.log(`\x1b[34m🔧 Mode selected:\x1b[0m ${mode}`);
    console.log(`\x1b[36m🌐 URL:\x1b[0m ${options.url}`);
    if (options.selector) {
      console.log(`\x1b[33m🎯 Selector:\x1b[0m ${options.selector}`);
    }

    switch (mode) {
      case 1:
        console.log("\x1b[36m🧪 Running Hover + Click Extractor...\x1b[0m");
        result = await extractWithHoverAndClick(options.url);
        break;
      case 2:
        console.log("\x1b[36m🔎 Running CSS Selector Extractor...\x1b[0m");
        result = await extractUsingCssSelector(options.url, options.selector);
        break;
      case 3:
        console.log("\x1b[36m🔍 Running XPath Selector Extractor...\x1b[0m");
        result = await extractUsingXPathSelector(options.url, options.selector);
        break;
      case 4:
        console.log("\x1b[36m📋 Running Raw URL List Extractor...\x1b[0m");
        result = await extractFromRawUrlList(options.rawInput);
        break;
      case 5:
        console.log("\x1b[36m🔗 Running All Anchor Links Extractor...\x1b[0m");
        result = await extractAllHrefLinks(options.url);
        break;
      default:
        console.error("\x1b[31m❌ Invalid mode. Use 1, 2, 3, 4 or 5.\x1b[0m");
        return [];
    }

    // ✅ Log the type and result count
    if (Array.isArray(result)) {
      console.log(
        `\x1b[32m🎉 Successfully extracted ${result.length} unique URLs.\x1b[0m`
      );
      console.log(...result); // ✅ Safe to spread here
      return result;
    } else {
      console.warn(
        `\x1b[33m⚠️  Extractor returned unexpected type: ${typeof result}\x1b[0m`
      );
      console.log("Raw result:", result); // ✅ Avoid spread
      return [];
    }
    return result;
  } catch (err) {
    console.error("\x1b[31m🔥 Error inside testUrlBuilder main():\x1b[0m", err.message);
    console.error("\x1b[90m", err.stack, "\x1b[0m");
    return [];
  }
}

module.exports = {
  main,
};
 
