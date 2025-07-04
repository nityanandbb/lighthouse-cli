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

// Function to read GitHub inputs (from the environment or GitHub Actions context);
const getGithubInputs = () => {
  return {
    projectName: process.env.PROJECT_NAME, 
    client: process.env.CLIENT, 
    projectManager: process.env.PROJECT_MANAGER, 
    qaManager: process.env.QA_MANAGER, 
    expectedLoadTime: process.env.EXPECTED_LOAD_TIME, 
  };
}; 

// Function to determine the final config to use (GitHub inputs or fallback to config.json)
const getFinalConfig = () => {
  const configData = getGithubInputs();

  const hasValidInput = Object.values(configData).some(
    (val) => val !== undefined && val !== ""
  );

  if (!hasValidInput) {
    console.log(
      "⚠️ No valid GitHub inputs found. Falling back to config.json..."
    );
    return getConfigData();
  }

  return configData;
};


// Function to save the final config to githubconfigsFile.json 
const saveConfigToFile = (configData) => {
  try {
    //Test undefined fallbacks
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
