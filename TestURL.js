// TestURL.js
const { executeLighthouseCLI } = require("./execution");

const urls = ["https://www.nvent.com/en-in/", "https://www.nvent.com/en-us/"];

// Execute Lighthouse CLI with local test URLs
executeLighthouseCLI(urls);
