// tools/sitemap/lib/sitemap/walker.js
// NOTE: If you hit ERR_REQUIRE_ESM here, pin to CJS-compatible version:
// npm i p-limit@2.3.0
const pLimit = require("p-limit");
const { fetchAndParse } = require("./fetcher");
const { childSitemaps, urlsetLocs } = require("./parser");

/**
 * walk({ entry, origin, onUrl, onSitemap, concurrency, maxSitemaps, shouldStop })
 * - onUrl(url) called for each candidate URL (same-origin already checked here)
 * - onSitemap(meta) called after parsing each sitemap file:
 *   { url, kind: "sitemapindex"|"urlset"|"unknown", childCount?, urlCount?, queueSize }
 */
async function walk({
  entry,
  origin,
  onUrl,
  onSitemap, // NEW
  concurrency = 8,
  maxSitemaps = 1000,
  shouldStop,
}) {
  const limit = pLimit(concurrency);
  const seen = new Set();
  const q = [entry];
  let processed = 0;

  while (q.length && processed < maxSitemaps && !shouldStop()) {
    const sitemapUrl = q.shift();
    if (seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);
    processed++;

    let obj;
    try {
      obj = await fetchAndParse(sitemapUrl);
    } catch {
      onSitemap?.({ url: sitemapUrl, kind: "unknown", queueSize: q.length });
      continue;
    }

    if (obj.sitemapindex) {
      const children = childSitemaps(obj).map((c) => {
        try { return new URL(c, sitemapUrl).toString(); } catch { return null; }
      }).filter(Boolean);

      for (const child of children) {
        try { if (new URL(child).origin === origin) q.push(child); } catch {}
      }

      onSitemap?.({
        url: sitemapUrl,
        kind: "sitemapindex",
        childCount: children.length,
        queueSize: q.length,
      });

    } else if (obj.urlset) {
      const locs = urlsetLocs(obj);

      onSitemap?.({
        url: sitemapUrl,
        kind: "urlset",
        urlCount: locs.length,
        queueSize: q.length,
      });

      await Promise.all(
        locs.map((u) =>
          limit(async () => {
            if (shouldStop()) return;
            try {
              const abs = new URL(u, sitemapUrl).toString();
              if (new URL(abs).origin !== origin) return; // same-origin only
              await onUrl(abs);
            } catch {}
          })
        )
      );
    } else {
      onSitemap?.({ url: sitemapUrl, kind: "unknown", queueSize: q.length });
    }
  }
}

module.exports = { walk };
