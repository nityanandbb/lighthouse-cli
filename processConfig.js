const fs = require("fs");

// Function to read the project configuration from config.json
const getConfigData = () => {
  try {
    const data = fs.readFileSync("config.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading config.json:", err);
    return {};
  }
};

// Function to read GitHub inputs (from the environment or GitHub Actions context)
const getGithubInputs = () => {
  const inputs = process.env.GITHUB_INPUTS
    ? JSON.parse(process.env.GITHUB_INPUTS)
    : {};
  return inputs;
};

// Function to determine the final config to use (GitHub inputs or fallback to config.json)
const getFinalConfig = () => {
  let configData = getGithubInputs();

  if (!configData || Object.keys(configData).length === 0) {
    console.log("No GitHub inputs received. Falling back to config.json...");
    configData = getConfigData();
  }

  return configData;
};

// Function to save the final config to githubconfigsFile.json
const saveConfigToFile = (configData) => {
  try {
    fs.writeFileSync(
      "githubconfigsFile.json",
      JSON.stringify(configData, null, 2),
      "utf8"
    );
    console.log("GitHub Configs saved to githubconfigsFile.json");
  } catch (err) {
    console.error("Error writing to githubconfigsFile.json:", err);
  }
};

// Main execution
const finalConfigData = getFinalConfig();
saveConfigToFile(finalConfigData);
