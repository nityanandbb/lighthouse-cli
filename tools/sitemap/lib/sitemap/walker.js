// tools/sitemap/lib/sitemap/walker.js

const pLimit = require("p-limit");
const { fetchAndParse } = require("./fetcher");
const { childSitemaps, urlsetLocs } = require("./parser");

async function walk({
  entry,
  origin,
  onUrl,
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
      continue;
    }

    if (obj.sitemapindex) {
      for (const c of childSitemaps(obj)) {
        try {
          const abs = new URL(c, sitemapUrl).toString();
          if (new URL(abs).origin === origin) q.push(abs);
        } catch {}
      }
    } else if (obj.urlset) {
      const locs = urlsetLocs(obj);
      await Promise.all(
        locs.map((u) =>
          limit(async () => {
            if (shouldStop()) return;
            try {
              const abs = new URL(u, sitemapUrl).toString();
              if (new URL(abs).origin !== origin) return;
              await onUrl(abs);
            } catch {}
          })
        )
      );
    }
  }
}

module.exports = { walk };
