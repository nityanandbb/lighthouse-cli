// tools/sitemap/lib/validate.js
module.exports = function validateFactory({ skip = false, timeoutMs = 10000 }) {
  return async function validate(url) {
    if (skip) return true;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      if (!res.ok || res.status === 405) {
        res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
        });
      }
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  };
};
