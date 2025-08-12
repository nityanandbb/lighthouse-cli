// tools/sitemap/lib/sitemap/fetcher.js

const { fetchTextMaybeGzip } = require("../utils/http");
const { parse } = require("./parser");

async function fetchAndParse(url) {
  const xml = await fetchTextMaybeGzip(url);
  const looksXml = xml.trim().startsWith("<");
  if (!looksXml) throw new Error("Not XML sitemap");
  return parse(xml);
}

module.exports = { fetchAndParse };
