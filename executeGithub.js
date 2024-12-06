// executeGithub.js
const { executeLighthouseCLI } = require("./execution");

// Fetch URLs from environment variables or default to an empty array
const urls = process.env.URLS ? process.env.URLS.split(",") : [];

// Validate input
if (!urls.length) {
  console.error("No URLs provided. Please set the URLS environment variable.");
  process.exit(1);
}

// Execute Lighthouse CLI with GitHub-provided URLs
executeLighthouseCLI(urls);
