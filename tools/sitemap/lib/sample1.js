// tools/sitemap/lib/sample.js
module.exports = function createSampler({
  mode,
  perGroup,
  targetTotal,
  groupKey,
}) {
  const groups = new Map();
  const all = new Set();

  function add(url) {
    // "all" mode keeps everything
    if (mode === "all") {
      all.add(url);
      return true;
    }

    const k = groupKey(url);
    if (!groups.has(k)) groups.set(k, []);
    const arr = groups.get(k);

    // per-group cap:
    // - "perGroup" and new "sample" use the provided perGroup value
    // - legacy "sample50" keeps the historical fixed 5-per-group default
    const limit = mode === "perGroup" || mode === "sample" ? perGroup : 5; // sample50 default

    if (arr.length >= limit) return false;

    arr.push(url);
    all.add(url);
    return true;
  }

  function isSatisfied() {
    // "all" and "perGroup" have no global cap
    if (mode === "all" || mode === "perGroup") return false;
    // "sample" and "sample50" stop at targetTotal; "random" also uses targetTotal
    return all.size >= targetTotal;
  }

  function finalize() {
    if (mode === "random") {
      const arr = Array.from(all);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, targetTotal);
    }
    // "sample" and "sample50" just return what's been gathered
    return Array.from(all);
  }

  return { add, isSatisfied, finalize };
};
