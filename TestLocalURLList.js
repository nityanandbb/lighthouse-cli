// TestLocalURLList.js
const { executeLighthouseCLI } = require("./execution");

const urls = [
  "https://www.nvent.com/en-in/caddy",
  "https://www.nvent.com/en-us/",
  "https://www.qed42.com/",
  "https://www.apple.com/",
  "https://www.amazon.in/",
  "https://www.flipkart.com/",
];

// Execute Lighthouse CLI with local test URLs
executeLighthouseCLI(urls);
