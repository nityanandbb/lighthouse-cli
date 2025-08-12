function compile(pattern) {
  if (!pattern) return null;
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

function hostAllowed(u, originUrl, { allowSubdomains, allowHosts, hostRe }) {
  // exact origin allowed by default
  if (u.origin === originUrl.origin) return true;

  // extra exact hosts
  if (allowHosts && allowHosts.length && allowHosts.includes(u.host))
    return true;

  // subdomains of the base host
  if (allowSubdomains) {
    const base = originUrl.hostname; // e.g., example.com
    if (u.hostname === base || u.hostname.endsWith(`.${base}`)) return true;
  }

  // regex
  if (hostRe) {
    const re = compile(hostRe);
    if (re && re.test(u.hostname)) return true;
  }

  return false;
}

/**
 * Filter logic:
 * 1) Host filter (same-origin by default; can allow subdomains/extra hosts/regex)
 * 2) Excludes (prefix/regex) on PATH
 * 3) startWith (OR) on PATH
 * 4) containsAll (AND) on PATH or PATH+QUERY
 * 5) containsAny (OR) on PATH or PATH+QUERY
 * 6) Legacy include/includeRe (require at least one if provided)
 */
module.exports = function buildFilter({
  origin,
  include = [],
  exclude = [],
  includeRe,
  excludeRe,
  startWith = [],
  containsAny = [],
  containsAll = [],
  matchQuery = false,
  allowSubdomains = false,
  allowHosts = [],
  hostRe = "",
}) {
  const originUrl = new URL(origin);
  const incRe = compile(includeRe);
  const excRe = compile(excludeRe);

  return (urlStr) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch {
      return false;
    }

    // 1) Host rules
    if (!hostAllowed(u, originUrl, { allowSubdomains, allowHosts, hostRe }))
      return false;

    // 2) Base path + optional query for contains checks
    const pathOnly = u.pathname;
    const pathPlusQuery =
      matchQuery && u.search ? `${u.pathname}${u.search}` : pathOnly;

    // Excludes first (fast fail)
    if (exclude.some((pref) => pathOnly.startsWith(pref))) return false;
    if (excRe && excRe.test(pathOnly)) return false;

    // 3) startWith (OR)
    if (
      startWith.length > 0 &&
      !startWith.some((pref) => pathOnly.startsWith(pref))
    ) {
      return false;
    }

    // 4) containsAll (AND)
    if (
      containsAll.length > 0 &&
      !containsAll.every((s) => pathPlusQuery.includes(s))
    ) {
      return false;
    }

    // 5) containsAny (OR)
    if (
      containsAny.length > 0 &&
      !containsAny.some((s) => pathPlusQuery.includes(s))
    ) {
      return false;
    }

    // 6) Legacy include/includeRe (if present, must match)
    if (include.length > 0 || incRe) {
      const hitPrefix =
        include.length > 0 && include.some((pref) => pathOnly.startsWith(pref));
      const hitRegex = incRe ? incRe.test(pathOnly) : false;
      if (!hitPrefix && !hitRegex) return false;
    }

    return true;
  };
};
