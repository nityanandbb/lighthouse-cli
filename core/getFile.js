// for debug only...
// core/githubTestUrlBuilder.js
const fs = require("fs");
const path = require("path");
const { main } = require("./testUrlBuilder");
/*
const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();
*/

/* local debug
 main(2, {
   url: "https://www.kotak.com",
   selector: ".header-menu> ul >li > a", // ".nav-item a", // You can change this selector to test different elements
 });
 */

// Debug code 
const mode = 1; 
const baseUrl = "https://www.kotak.com/en";
const selector = ""; //.header-menu> ul >li > a";
//

async function run() {
    let urls;

    try {
        urls = await main(mode, { url: baseUrl, selector });
        /*
          if (!Array.isArray(urls)) {
            console.error("❌ Extractor did not return an array. Got:", urls);
            throw new Error("Extractor did not return an array.");
          }
          */

        const finalURLs = [
            ...new Set(urls.map((u) => u.trim().replace(/\/$/, ""))),
        ].filter(Boolean);

        const filePath = path.resolve(process.cwd(), "TestURL.js");

        // 🔹 Log full resolved file path
        console.log("\n🔹 File will be written to:", filePath);
     
   } catch (err) {
    console.error("\n❌ Error in main() or extractor:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
  
}

run();
