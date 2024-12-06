npm install -g @lhci/cli

npm init -y  # Initialize package.json if not already initialized
npm install --save-dev @lhci/cli

//
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Install the ARM64 version of Node.js
nvm install node --arch=arm64
nvm use node


// 
# Install Lighthouse CI if not already installed
npm install --save-dev @lhci/cli

# Step 1: Create a .lighthouserc.json file in your project root with URLs to test

# Step 2: Collect Lighthouse reports
npx lhci collect

# Step 3: Upload results to temporary public storage
npx lhci upload --target=temporary-public-storage


// run 

node generate-lighthouse-report.js


 npx lhci collect --url="https://www.nvent.com/en-us/data-solutions" --config=lighthouse-config.json --emulatedFormFactor=mobile
npx lhci collect --url="https://www.nvent.com/en-us/data-solutions" --config=lighthouse-config.json --emulatedFormFactor=desktop

// 
{
  "extends": "lighthouse:default",
  "settings": {
    "onlyCategories": ["performance", "accessibility"],
    "emulatedFormFactor": "desktop"
  }
}

// npx lhci collect

// 1. set .lighthouserc.json >> mobiile/desktop
// 2. inpurt urls list.
// 3. g2r,js
// 4. data extract.
//5. generate html.
//6. export csv.
// 7. before all input ::- project details.

// g2r //single
node generateHtmlReport.js  
 node exportToCsv.js  
 
 node g2r.js    

 lhci collect --additive --settings.configPath=./path/to/desktop-config.js --url=https://www.qed42.com/?desktop
 lhci collect --additive --settings.configPath=./path/to/mobile-config.js --url=https://www.qed42.com/?mobile
lhci collect --additive --settings.configPath=./mobile-config.js --url=https://www.qed42.com/?mobile
lhci collect --additive --settings.configPath=./mobile-config.js --url="https://www.qed42.com/?mobile"

>> npx lhci collect --url="https://www.qed42.com/about" --emulatedFormFactor=mobile --preset=mobile

npx lhci collect --url="https://www.qed42.com/about" --emulatedFormFactor=desktop --preset=desktop


>>>  Final
npx lhci collect --url="https://www.qed42.com/about" --emulatedFormFactor=mobile --preset=mobile

npx lhci collect --url="https://www.qed42.com/about" --emulatedFormFactor=desktop --preset=desktop


// main 

node executions.
 node generateFinalHtmlReport.js

 // export final csv.js