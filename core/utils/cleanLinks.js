// utils/cleanLinks.js
function cleanAndFilterLinks(allLinks, baseUrl) {
  const baseOrigin = new URL(baseUrl).origin;

  const cleaned = allLinks
    .map((href) => {
      if (
        !href ||
        href === "#" ||
        href.startsWith("javascript") ||
        href.startsWith("mailto:")
      ) {
        return null;
      }
      try {
        return new URL(href, baseUrl).href;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((url) => url.startsWith(baseOrigin));

  return [...new Set(cleaned)];
}

module.exports = { cleanAndFilterLinks };
