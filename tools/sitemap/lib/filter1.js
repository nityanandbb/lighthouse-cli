// tools/sitemap/lib/filter.js

function compile(pattern) {
  if (!pattern) return null;
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

module.exports = function buildFilter({
  origin,
  include = [],
  exclude = [],
  includeRe,
  excludeRe,
}) {
  const incRe = compile(includeRe);
  const excRe = compile(excludeRe);

  return (urlStr) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch {
      return false;
    }
    if (u.origin !== origin) return false;

    const p = u.pathname;

    if (include.length > 0) {
      const prefixHit = include.some((pref) => p.startsWith(pref));
      const regexHit = incRe ? incRe.test(p) : false;
      if (!prefixHit && !regexHit) return false;
    }

    if (exclude.some((pref) => p.startsWith(pref))) return false;
    if (excRe && excRe.test(p)) return false;

    return true;
  };
};
