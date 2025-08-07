// core/githubTestUrlBuilder.js
const fs = require("fs");
const path = require("path");
const { main } = require("./testUrlBuilder");

const mode = parseInt(process.env.MODE, 10);
const baseUrl = process.env.BASE_URL?.trim();
const selector = process.env.SELECTOR?.trim();

/* local debug
 main(2, {
   url: "https://www.kotak.com",
   selector: ".header-menu> ul >li > a", // ".nav-item a", // You can change this selector to test different elements
 });
/* Debug code 
const mode = 2;
const baseUrl = "https://www.kotak.com";
const selector = ".header-menu> ul >li > a";
*/

async function run() {
  let urls;

  try {
    urls = await main(mode, { url: baseUrl, selector });

    if (!Array.isArray(urls)) {
      console.error("❌ Extractor did not return an array. Got:", urls);
      throw new Error("Extractor did not return an array.");
    }

    const finalURLs = [
      ...new Set(urls.map((u) => u.trim().replace(/\/$/, ""))),
    ].filter(Boolean);

    const filePath = path.resolve(process.cwd(), "TestURL.js");

    // 🔹 Log full resolved file path
    console.log("\n🔹 File will be written to:", filePath);

    // 🔹 Run `ls -a` to show all files (simulate from JS)
    console.log("\n📂 Listing current directory:");
    const files = fs.readdirSync(process.cwd(), { withFileTypes: true });
    files.forEach((f) => console.log("📄", f.name));

    // 🔹 Build file content but delay writing
    const fileContent = `exports.urls = ${JSON.stringify(
      finalURLs,
      null,
      2
    )};\n`;

    // 🔹 Log what content will be written
    console.log("\n📦 Content to be written:\n", fileContent);

    // 🔹 Actually write the file
    fs.writeFileSync(filePath, fileContent);

    console.log("\n✅ File written successfully.");
  } catch (err) {
    console.error("\n❌ Error in main() or extractor:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
