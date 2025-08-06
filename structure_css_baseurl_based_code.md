📁 puppeteer-link-checker/
│
├── 📄 run.js                         # Main entry to run any mode
├── 📄 TestURL.js                     # Generated list of URLs (for Lighthouse)
│
├── 📁 core/                          # Core logic (switch handler + shared logic)
│   ├── testUrlBuilder.js            # Handles main(mode, options) switch logic
│   └── utils/
│       ├── writeToTestFile.js       # Common file writer for TestURL.js
│       └── cleanLinks.js            # Common link filtering and normalization
│
├── 📁 extractors/                    # All 5 mode extractors go here
│   ├── hoverAndClick.js             # Mode 1 - Predefined selectors + hover/click
│   ├── cssSelectorMode.js           # Mode 2 - Custom CSS selector
│   ├── xpathSelectorMode.js         # Mode 3 - Custom XPath selector
│   ├── rawListMode.js               # Mode 4 - Raw pasted URL list
│   └── allAnchorLinksMode.js        # ✅ Mode 5 - All <a href> tag collector
│
├── 📁 reports/                       # Optional - Output logs, screenshots (if added)
│
└── 📁 lighthouse/                    # Lighthouse runner (if separate files used)
    └── execution.js                 # executeLighthouseCLI() logic

V
V




📁 puppeteer-link-checker/
│
├── run.js                         # Entry point
├── core/
│   ├── testUrlBuilder.js          # main() switch logic for all modes
│   └── utils/
│       ├── cleanLinks.js
│       ├── writeToTestFile.js
│       └── pageInteractions.js    # Click/Hover utils
│
├── extractors/
│   ├── hoverAndClick.js           # Mode 1 wrapper
│   ├── predefinedExtractor.js     # Logic for predefined CSS patterns
│   ├── cssSelectorMode.js         # Mode 2
│   ├── xpathSelectorMode.js       # Mode 3
│   ├── rawListMode.js             # Mode 4
│   └── allAnchorLinksMode.js      # Mode 5
│
├── TestURL.js                     # Output file
└── package.json



To test **Mode 2, 3, and 5** in your Puppeteer link extractor setup, you can manually invoke each mode by modifying the `run.js` file (or whichever entry point you use).

---

### ✅ Step-by-Step: How to Test Mode 2, 3, 5

#### 🧩 First, make sure your `run.js` looks like this:

```js
// run.js
const { main } = require("./core/testUrlBuilder");

// ⬇️ Change these values based on the mode you want to test

// MODE 2: CSS Selector
// main(2, { url: "https://example.com", selector: ".nav a" });

// MODE 3: XPath Selector
// main(3, { url: "https://example.com", selector: "//a[contains(@class, 'nav-link')]" });

// MODE 5: Extract all <a href> links from page
main(5, { url: "https://example.com" });
```

---

### 🔍 Explanation by Mode

#### ✅ Mode 2: `extractUsingCssSelector`

```js
main(2, {
  url: "https://www.qed42.com",
  selector: ".nav-item a"  // You can change this selector to test different elements
});
```

#### ✅ Mode 3: `extractUsingXPathSelector`

```js
main(3, {
  url: "https://www.qed42.com",
  selector: "//nav//a"  // XPath example: Get all links inside <nav>
});
```

#### ✅ Mode 5: `extractAllHrefLinks`

```js
main(5, {
  url: "https://www.qed42.com"
});
```

This will go to the site and extract **all `<a href>`** values on the page (whether visible or hidden).

---

### 🧪 Output Location

All modes should write results to the same output file:

```
📁 Written to TestURL.js with N URLs.
```

Make sure:

* Your selectors are correct and match real elements
* The page doesn't load content via delayed JS (or handle this with proper `waitForTimeout`)
* You review `TestURL.js` or console output to verify results

---

Let me know if you'd like ready-made selectors for a few real sites for quick testing or if your `cssSelectorMode.js`, `xpathSelectorMode.js`, or `allAnchorLinksMode.js` need updates.
