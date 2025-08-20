"use strict";

// Per-URL Issues section (stack Desktop first, then Mobile below it)
// - Groups entries by URL and keeps the newest run per device
// - Orders cards: Desktop, then Mobile, for each URL
// - Red left rail + severity chips
// - Hides “…and N more” when N <= 0
// - Thumbnails for image evidence URLs
// - Expand/Collapse All + “High only” filter
//
// Usage in v13:
//   const { renderPerUrlIssuesSection } = require("./analysis/components/render_PerUrl_Issues_Section_v1.js");
//   html += renderPerUrlIssuesSection(perUrlList, { includeAccessibility:true, includeSEO:true });

function renderPerUrlIssuesSection(rawData, opts) {
  opts = opts || {};
  var includeAccessibility =
    opts.includeAccessibility !== undefined
      ? !!opts.includeAccessibility
      : false;
  var includeSEO = !!opts.includeSEO;

  // ---------- helpers ----------
  function esc(s) {
    s = s === undefined || s === null ? "" : String(s);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function toArray(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return Object.values(v);
    return [];
  }
  function isImageUrl(u) {
    return /\.(avif|webp|png|jpe?g|gif|svg)(\?|#|$)/i.test(String(u || ""));
  }
  function fmt(x, d) {
    d = d === undefined ? "—" : d;
    return x === 0 || !!x ? x : d;
  }
  function derivePriority(issue) {
    if (issue && issue.priority) return String(issue.priority).toLowerCase();
    var s = issue && typeof issue.score === "number" ? issue.score : null;
    if (s === null) return "low";
    if (s < 0.5) return "high";
    if (s < 0.9) return "medium";
    return "low";
  }

  // Keep newest entry per (url,device)
  function newestByUrlDevice(list) {
    var map = new Map(); // key: url::device -> pack
    list.forEach(function (p) {
      if (!p || !p.url) return;
      var dev = (p.device || "desktop").toLowerCase();
      if (dev !== "desktop" && dev !== "mobile") dev = "desktop";
      var key = p.url + "::" + dev;
      var t = Date.parse(p.analysisDate || "") || 0;
      var prev = map.get(key);
      if (!prev || t > (Date.parse(prev.analysisDate || "") || 0))
        map.set(key, p);
    });
    // group by URL
    var grouped = new Map(); // url -> {desktop, mobile}
    Array.from(map.values()).forEach(function (p) {
      var dev = (p.device || "desktop").toLowerCase();
      var g = grouped.get(p.url) || { desktop: null, mobile: null };
      g[dev] = p;
      grouped.set(p.url, g);
    });
    return grouped;
  }

  // normalize input -> array
  var input = toArray(rawData);
  var grouped = newestByUrlDevice(input); // Map(url -> {desktop, mobile})
  var orderedUrls = Array.from(grouped.keys()).sort();

  // unique section id
  var sectionId = "perurl_" + Math.random().toString(36).slice(2, 8);

  // ---------- small HTML builders ----------
  function metricChip(label, value, bad) {
    return (
      '<span class="pill' +
      (bad ? " bad" : "") +
      '">' +
      esc(label) +
      " " +
      esc(value) +
      "</span>"
    );
  }

  function issueCard(issue) {
    var p = derivePriority(issue);
    var score =
      issue && typeof issue.score === "number"
        ? Math.round(issue.score * 100)
        : null;

    var metaBits = [];
    if (score !== null) metaBits.push("score " + score);
    if (issue && issue.display) metaBits.push(esc(issue.display));
    var metaHtml = metaBits.length
      ? '<div class="meta">' + metaBits.join("  •  ") + "</div>"
      : "";

    var howHtml = "";
    if (issue && Array.isArray(issue.fix) && issue.fix.length) {
      howHtml =
        '<ul class="howto">' +
        issue.fix
          .map(function (s) {
            return "<li>" + esc(s) + "</li>";
          })
          .join("") +
        "</ul>";
    }

    var ev = (issue && issue.evidence) || {};
    var items = Array.isArray(ev.topItems) ? ev.topItems : [];
    var more = Math.max(0, +ev.moreCount || 0);

    var evLines = items
      .map(function (it) {
        var parts = [];
        if (it.url) parts.push(esc(it.url));
        if (it.label && it.label !== it.url)
          parts.push("(" + esc(it.label) + ")");
        if (it.wastedMs) parts.push("wasted " + Math.round(it.wastedMs) + "ms");
        if (it.wastedBytes) parts.push(it.wastedBytes + "B");
        if (it.transferSize) parts.push(it.transferSize + "B xfer");
        var thumbs =
          it.url && isImageUrl(it.url)
            ? '<div class="thumbs"><img src="' +
              esc(it.url) +
              '" alt="evidence"/></div>'
            : "";
        return '<div class="ev">' + parts.join("  •  ") + thumbs + "</div>";
      })
      .join("");

    var moreHtml =
      more > 0
        ? '<div class="ev" style="opacity:.85">…and ' + more + " more</div>"
        : "";
    var learn =
      issue && issue.learnMore
        ? ' <a href="' +
          esc(issue.learnMore) +
          '" target="_blank" rel="noopener">Learn more</a>'
        : "";
    var desc = (issue && (issue.why || issue.description)) || "";

    return (
      "" +
      '<div class="issue">' +
      '<div class="rail"></div>' +
      '<div class="issue-body">' +
      '<div class="title"><span class="priority ' +
      esc(p) +
      '">' +
      esc(p.toUpperCase()) +
      "</span> " +
      esc((issue && (issue.title || issue.id)) || "Untitled issue") +
      "</div>" +
      metaHtml +
      '<div class="desc">' +
      esc(desc) +
      learn +
      "</div>" +
      howHtml +
      '<div class="evidence">' +
      evLines +
      moreHtml +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function categoryBlock(label, arr) {
    var list = Array.isArray(arr) ? arr.slice() : [];
    var weight = { high: 0, medium: 1, low: 2 };
    list.sort(function (a, b) {
      return (
        (weight[derivePriority(a)] || 9) - (weight[derivePriority(b)] || 9)
      );
    });
    var body = list.length
      ? list.map(issueCard).join("")
      : '<div class="ev" style="margin:12px">No issues.</div>';
    return (
      "" +
      "<details>" +
      "<summary>" +
      esc(label) +
      " (" +
      list.length +
      ")</summary>" +
      "<div>" +
      body +
      "</div>" +
      "</details>"
    );
  }

  function singleRunCard(p) {
    var m = (p && p.metrics) || {};
    var lcpBad = parseFloat(String(m.lcp || "").replace(/[^\d.]/g, "")) > 2.5;
    var clsBad = parseFloat(m.cls || 0) > 0.1;
    var tbtBad = parseFloat(String(m.tbt || "").replace(/[^\d.]/g, "")) > 200;

    var header =
      "" +
      '<div class="url-header">' +
      '<span class="u-url">' +
      esc(p.url || "—") +
      "</span>" +
      '<span class="pill">Device: ' +
      esc(p.device || "desktop") +
      "</span>" +
      '<span class="pill">Perf ' +
      esc(fmt(m.performance)) +
      "</span>" +
      '<span class="pill">A11y ' +
      esc(fmt(m.accessibility)) +
      "</span>" +
      '<span class="pill">BP ' +
      esc(fmt(m.bestPractices)) +
      "</span>" +
      '<span class="pill">SEO ' +
      esc(fmt(m.seo)) +
      "</span>" +
      metricChip("LCP", fmt(m.lcp), lcpBad) +
      metricChip("FCP", fmt(m.fcp), false) +
      metricChip("CLS", fmt(m.cls), clsBad) +
      metricChip("TBT", fmt(m.tbt), tbtBad) +
      (p.reportPath
        ? '<a class="pill" href="' +
          esc(p.reportPath) +
          '" target="_blank" rel="noopener">Open full report</a>'
        : "") +
      "</div>";

    var perf = categoryBlock(
      "Performance Issues",
      (p.issues && p.issues.performance) || []
    );
    var a11y = includeAccessibility
      ? categoryBlock(
          "Accessibility Issues",
          (p.issues && p.issues.accessibility) || []
        )
      : "";
    var bp = categoryBlock(
      "Best Practices Issues",
      (p.issues && p.issues.bestPractices) || []
    );
    var seo = includeSEO
      ? categoryBlock("SEO Issues", (p.issues && p.issues.seo) || [])
      : "";

    return (
      '<section class="url-card">' +
      header +
      perf +
      a11y +
      bp +
      seo +
      "</section>"
    );
  }

  function urlGroupBlock(url, pair) {
    // Order: Desktop first, then Mobile (if present)
    var parts = [];
    if (pair.desktop) parts.push(singleRunCard(pair.desktop));
    if (pair.mobile) parts.push(singleRunCard(pair.mobile));
    // If neither present (unlikely), return nothing
    if (!parts.length) return "";
    // Wrap with group title (url once)
    return (
      "" +
      '<div class="url-group">' +
      '<div class="group-title">' +
      esc(url) +
      "</div>" +
      parts.join("") +
      "</div>"
    );
  }

  // ---------- CSS (namespaced) ----------
  var css =
    "" +
    "<style>" +
    "  #" +
    sectionId +
    " .lh-issues { font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; }" +
    "  #" +
    sectionId +
    " .group-title { font-weight:700; margin: 18px 0 6px; font-size: 15px; opacity:.9; }" +
    "  #" +
    sectionId +
    " .url-card { margin: 12px 0 20px; padding: 16px; border-radius: 12px; background: #0f1117; color: #e8e8e8; border: 1px solid #2a2d34; }" +
    "  #" +
    sectionId +
    " .url-header { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:12px; }" +
    "  #" +
    sectionId +
    " .u-url { font-weight: 600; word-break: break-all; }" +
    "  #" +
    sectionId +
    " .pill { padding:2px 8px; border-radius:999px; font-size:12px; background:#1c1f26; border:1px solid #30333b; }" +
    "  #" +
    sectionId +
    " .pill.bad { background:#2a0000; border-color:#5a1d1d; color:#ffb3b3; }" +
    "  #" +
    sectionId +
    " details { border:1px solid #2a2d34; border-radius:10px; margin:10px 0; background:#0c0f13; }" +
    "  #" +
    sectionId +
    " summary { cursor:pointer; padding:12px 14px; font-weight:600; list-style:none; }" +
    "  #" +
    sectionId +
    " summary::-webkit-details-marker { display:none; }" +
    "  #" +
    sectionId +
    ' summary::after { content:"▸"; float:right; transition: transform .15s ease; }' +
    "  #" +
    sectionId +
    " details[open] summary::after { transform: rotate(90deg); }" +
    "  #" +
    sectionId +
    " .issue { display:grid; grid-template-columns: 6px 1fr; gap:0; margin:10px; border-radius:10px; overflow:hidden; border:1px solid #2a2d34; background:#12151c; }" +
    "  #" +
    sectionId +
    " .rail { background:#b71c1c; }" +
    "  #" +
    sectionId +
    " .issue-body { padding:12px 14px; }" +
    "  #" +
    sectionId +
    " .title { font-weight:600; margin-bottom:6px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; }" +
    "  #" +
    sectionId +
    " .priority { font-size:12px; padding:2px 8px; border-radius:999px; border:1px solid #333; }" +
    "  #" +
    sectionId +
    " .priority.high { background:#2a0000; color:#ff9a9a; border-color:#5a1d1d; }" +
    "  #" +
    sectionId +
    " .priority.medium { background:#2d2400; color:#ffd47a; border-color:#5b4c10; }" +
    "  #" +
    sectionId +
    " .priority.low { background:#0a2b0f; color:#a3f3b0; border-color:#1e5a2b; }" +
    "  #" +
    sectionId +
    " .meta { font-size:13px; opacity:.9; display:flex; gap:10px; flex-wrap:wrap; margin:6px 0 8px; }" +
    "  #" +
    sectionId +
    " .desc { font-size:13px; opacity:.9; margin-bottom:8px; white-space:pre-line; }" +
    "  #" +
    sectionId +
    " .howto { font-size:13px; margin:8px 0; padding-left:16px; }" +
    "  #" +
    sectionId +
    " .howto li { margin:2px 0; }" +
    "  #" +
    sectionId +
    " .evidence { display:flex; flex-direction:column; gap:6px; }" +
    "  #" +
    sectionId +
    " .ev { font-size:12px; background:#0c0f13; border:1px solid #23262f; padding:8px; border-radius:8px; overflow:auto; }" +
    "  #" +
    sectionId +
    " .thumbs { display:flex; gap:8px; margin-top:6px; flex-wrap:wrap; }" +
    "  #" +
    sectionId +
    " .thumbs img { width:120px; height:auto; border-radius:6px; border:1px solid #2a2d34; }" +
    "  #" +
    sectionId +
    " .controls { display:flex; gap:8px; align-items:center; margin:8px 0 4px; }" +
    "  #" +
    sectionId +
    " .controls button, #" +
    sectionId +
    " .controls label { background:#171a21; border:1px solid #2a2d34; color:#e8e8e8; border-radius:8px; padding:6px 10px; cursor:pointer; font-size:13px; }" +
    "  #" +
    sectionId +
    " .hidden { display:none !important; }" +
    "</style>";

  // ---------- controls + grouped cards ----------
  var controls =
    "" +
    '<div class="controls">' +
    '<button type="button" data-act="expAll">Expand all</button>' +
    '<button type="button" data-act="colAll">Collapse all</button>' +
    '<label><input id="' +
    sectionId +
    '_highOnly" type="checkbox"> High only</label>' +
    "</div>";

  var bodyParts = orderedUrls
    .map(function (url) {
      var pair = grouped.get(url);
      return urlGroupBlock(url, pair);
    })
    .filter(Boolean);

  var body = bodyParts.join("");
  if (!body)
    body =
      '<div class="ev" style="margin:12px">No valid URL entries to display.</div>';

  // ---------- tiny script ----------
  var js =
    "" +
    "<script>(function(){" +
    'var root=document.getElementById("' +
    sectionId +
    '");' +
    "if(!root)return;" +
    'function detailsEls(){return Array.prototype.slice.call(root.querySelectorAll("details"));}' +
    'var exp=root.querySelector("[data-act=\\"expAll\\"]");' +
    'var col=root.querySelector("[data-act=\\"colAll\\"]");' +
    'if(exp){exp.addEventListener("click",function(){detailsEls().forEach(function(d){d.open=true;});});}' +
    'if(col){col.addEventListener("click",function(){detailsEls().forEach(function(d){d.open=false;});});}' +
    'var hi=document.getElementById("' +
    sectionId +
    '_highOnly");' +
    'if(hi){hi.addEventListener("change",function(){' +
    "var on=hi.checked;" +
    'Array.prototype.forEach.call(root.querySelectorAll(".issue"),function(card){' +
    'var isHigh=!!card.querySelector(".priority.high");' +
    'card.style.display=on?(isHigh?"":"none"):"";' +
    "});" +
    "});}" +
    "})();</" +
    "script>";

  // ---------- assemble section ----------
  var html =
    "" +
    '<section id="' +
    sectionId +
    '">' +
    css +
    '<div class="lh-issues">' +
    '<h2 style="margin:8px 0 4px">Issues by URL</h2>' +
    controls +
    body +
    "</div>" +
    js +
    "</section>";

  return html;
}

module.exports = { renderPerUrlIssuesSection };
