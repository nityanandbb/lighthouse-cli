const zlib = require("zlib");

function normalizeInputUrl(input, defaultSitemap) {
  let u;
  try {
    u = new URL(input);
  } catch {
    throw new Error("Invalid input URL");
  }
  if (u.pathname.endsWith("/sitemap.xml")) return u.toString();
  if (!defaultSitemap)
    throw new Error(
      "Input must end with /sitemap.xml when defaultSitemap=false"
    );
  if (!u.pathname.endsWith("/")) u.pathname += "/";
  u.pathname += "sitemap.xml";
  return u.toString();
}

async function fetchTextMaybeGzip(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch ${res.status} for ${url}`);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const gz =
    url.endsWith(".gz") ||
    ct.includes("application/gzip") ||
    ct.includes("gzip");
  if (gz) {
    const buf = Buffer.from(await res.arrayBuffer());
    return zlib.gunzipSync(buf).toString("utf8");
  }
  return res.text();
}

module.exports = { normalizeInputUrl, fetchTextMaybeGzip };
