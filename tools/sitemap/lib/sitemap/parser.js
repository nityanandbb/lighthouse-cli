// tools/sitemap/lib/sitemap/parser.js
 const { XMLParser } = require("fast-xml-parser");
 const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

 function parse(xmlStr) {
   return parser.parse(xmlStr);
 }

 function childSitemaps(obj) {
   if (!obj || !obj.sitemapindex) return [];
   const list = obj.sitemapindex.sitemap || [];
   const arr = Array.isArray(list) ? list : [list];
   return arr.map((s) => s.loc).filter(Boolean);
 }

 function urlsetLocs(obj) {
   if (!obj || !obj.urlset) return [];
   const list = obj.urlset.url || [];
   const arr = Array.isArray(list) ? list : [list];
   return arr.map((u) => u.loc).filter(Boolean);
 }

 module.exports = { parse, childSitemaps, urlsetLocs };
