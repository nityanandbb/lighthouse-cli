const { walk } = require("../lib/sitemap/walker");

module.exports = async function walkXmlSitemaps(opts) {
  return walk(opts);
};
