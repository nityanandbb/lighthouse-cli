// tools/sitemap/lib/group.js

function key(urlStr) {
  const { pathname } = new URL(urlStr);
  const lang = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
  if (lang) return `/${lang[1]}/`;
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg ? `/${seg}/` : "/";
}
module.exports = { key };
