// tools/sitemap/lib/sample.js
module.exports = function createSampler({
  mode,
  perGroup,
  targetTotal,
  groupKey,
}) {
  const groups = new Map();
  const all = new Set();

  const isSampling =
    mode === "sample" || mode === "sample50" || mode === "random";

  function add(url) {
    // "all" keeps everything
    if (mode === "all") {
      all.add(url);
      return true;
    }

    // HARD CAP to prevent overshoot with concurrency
    if (isSampling && all.size >= targetTotal) return false;

    const k = groupKey(url);
    if (!groups.has(k)) groups.set(k, []);
    const arr = groups.get(k);

    // per-group cap:
    // - "sample" & "perGroup" use provided perGroup
    // - legacy "sample50" fixed to 5
    const limit = mode === "perGroup" || mode === "sample" ? perGroup : 5;
    if (arr.length >= limit) return false;

    arr.push(url);
    all.add(url);
    return true;
  }

  function isSatisfied() {
    // "all" and "perGroup" have no global cap
    if (mode === "all" || mode === "perGroup") return false;
    return all.size >= targetTotal;
  }

  function finalize() {
    // Always trim at the end for sampling modes to guarantee exact size
    const list = Array.from(all);

    if (mode === "random") {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list.slice(0, targetTotal);
    }

    if (mode === "sample" || mode === "sample50") {
      return list.slice(0, targetTotal);
    }

    // "all" and "perGroup"
    return list;
  }

  return { add, isSatisfied, finalize };
};
