// analysis.js
const fs = require("fs");
const {
  readReports,
  AREA_MAP,
  HOW_FIX,
  priorityFromScore,
  calculateSavings,
  pluckEvidence,
} = require("./helpers");

function roundScore(s) {
  return Math.round((s || 0) * 100);
}
function extractMetrics(categories) {
  return {
    performance: roundScore(categories?.performance?.score),
    accessibility: roundScore(categories?.accessibility?.score),
    bestPractices: roundScore(categories?.["best-practices"]?.score),
    seo: roundScore(categories?.seo?.score),
  };
}

function sitePriority(worstScore, count) {
  const sev = worstScore < 0.5 ? "high" : worstScore < 0.9 ? "medium" : "low";
  if (sev === "high" && count >= 3) return "high";
  if ((sev === "high" || sev === "medium") && count >= 2) return "medium";
  return "low";
}

function runAnalysis({
  reportsDir = ".lighthouseci",
  outPerUrl = "per_url_prioritized.json",
  outSite = "site_common_issues.json",
  topPerCategory = 0, // 0 = all
} = {}) {
  const reports = readReports(reportsDir);
  const perUrl = {};
  const siteIndex = {}; // auditId -> {area,title,urls:Set, worst:1}

  for (const r of reports) {
    const key = `${r.url}_${r.deviceType}`;
    const categories = r.data.categories || {};
    const audits = r.data.audits || {};
    const metrics = extractMetrics(categories);

    const urlPack = {
      url: r.url,
      device: r.deviceType,
      analysisDate: new Date().toISOString(),
      metrics,
      issues: {
        performance: [],
        accessibility: [],
        bestPractices: [],
        seo: [],
      },
    };

    // AuditRefs help map audit -> category names
    const auditToCat = {};
    for (const [catKey, catVal] of Object.entries(categories)) {
      for (const ref of catVal?.auditRefs || []) auditToCat[ref.id] = catKey;
    }

    for (const [id, a] of Object.entries(audits)) {
      if (a?.score === null || a?.score === 1) continue; // pass → skip
      const catKey = auditToCat[id] || "best-practices";
      const bucket = catKey === "best-practices" ? "bestPractices" : catKey;
      const area =
        AREA_MAP[id] ||
        (bucket === "bestPractices" ? "best_practices" : bucket);

      const issue = {
        id,
        title: a.title || id,
        description: a.description || "",
        score: a.score,
        display: a.displayValue || "",
        savings: calculateSavings(a),
        area,
        priority: priorityFromScore(a.score),
        why_it_matters: undefined, // keep slot if you want later
        how_to_fix: HOW_FIX[id] || null,
        evidence: pluckEvidence(a, 5), // <-- fixes “...and 5 more” with topItems + moreCount
      };
      urlPack.issues[bucket].push(issue);

      // site roll-up
      const idx = siteIndex[id] || {
        area,
        title: issue.title,
        urls: new Set(),
        worst: 1,
      };
      idx.area = area;
      idx.title = issue.title;
      idx.urls.add(r.url);
      idx.worst = Math.min(idx.worst, a.score ?? 1);
      siteIndex[id] = idx;
    }

    // sort and optionally cap top per category
    const rank = { high: 3, medium: 2, low: 1 };
    for (const cat of Object.keys(urlPack.issues)) {
      urlPack.issues[cat].sort(
        (a, b) =>
          rank[b.priority] - rank[a.priority] || (a.score ?? 1) - (b.score ?? 1)
      );
      if (topPerCategory > 0)
        urlPack.issues[cat] = urlPack.issues[cat].slice(0, topPerCategory);
    }

    // human headers
    const byCat = Object.fromEntries(
      Object.entries(urlPack.issues).map(([k, v]) => [k, v.length])
    );
    const priCount = { high: 0, medium: 0, low: 0 };
    for (const arr of Object.values(urlPack.issues))
      for (const it of arr) priCount[it.priority]++;

    urlPack.status = Object.values(urlPack.metrics).some((v) => v < 90)
      ? "needs_improvement"
      : "good";
    urlPack.issues_count = {
      by_category: byCat,
      by_priority: priCount,
      total: Object.values(byCat).reduce((a, b) => a + b, 0),
    };

    perUrl[key] = urlPack;
  }

  // write per-url
  fs.writeFileSync(outPerUrl, JSON.stringify(perUrl, null, 2));

  // site common issues
  const common = Object.entries(siteIndex)
    .map(([auditId, info]) => {
      const affected = Array.from(info.urls);
      return {
        area: info.area,
        issue_title: info.title || auditId.replace(/-/g, " "),
        audit_id: auditId,
        priority: sitePriority(info.worst, affected.length),
        affected_urls: affected,
        affected_count: affected.length,
        how_to_fix: HOW_FIX[auditId] || null,
      };
    })
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return (
        rank[b.priority] - rank[a.priority] ||
        b.affected_count - a.affected_count
      );
    });

  fs.writeFileSync(
    outSite,
    JSON.stringify(
      {
        common_issues: common,
        generated_at: new Date().toISOString(),
        version: "lh-agg-v1",
      },
      null,
      2
    )
  );

  console.log(`✅ Wrote ${outPerUrl} and ${outSite}`);
}

if (require.main === module) {
  // CLI: node analysis.js [reportsDir] [topPerCategory]
  const reportsDir = process.argv[2] || ".lighthouseci";
  const top = Number(process.argv[3] || 0);
  runAnalysis({ reportsDir, topPerCategory: top });
}

module.exports = { runAnalysis };
