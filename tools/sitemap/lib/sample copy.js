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
    if (mode === "all") {
      all.add(url);
      return true;
    }
    const k = groupKey(url);
    if (!groups.has(k)) groups.set(k, []);
    const arr = groups.get(k);
    const limit = mode === "perGroup" ? perGroup : 5;
    if (arr.length >= limit) return false;
    arr.push(url);
    all.add(url);
    return true;
  }

  function isSatisfied() {
    if (mode === "all" || mode === "perGroup") return false;
    return all.size >= targetTotal;
  }

  function finalize() {
    if (mode !== "random") return Array.from(all);
    const arr = Array.from(all);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, targetTotal);
  }

  return { add, isSatisfied, finalize };
};
