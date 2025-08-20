// lh-embed.js
// Drop-in, no deps. Renders summary_report.json into a Shadow DOM widget.
// Modes:
//  A) Zero-touch overlay: <script src="lh-embed.js" data-json="reports/summary_report.json"></script>
//  B) One-line mount: window.LHEmbed.render({ jsonUrl: "reports/summary_report.json", target: "#container" });

(function (global) {
  "use strict";

  function esc(s = "") {
    return String(s).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }
  function classifyEffort(auditId, area) {
    const quick = new Set([
      "uses-text-compression",
      "uses-long-cache-ttl",
      "font-display",
      "preload-fonts",
      "uses-optimized-images",
      "modern-image-formats",
      "uses-responsive-images",
      "offscreen-images",
      "render-blocking-resources",
      "uses-rel-preconnect",
      "uses-rel-preload",
    ]);
    const heavy = new Set([
      "unused-javascript",
      "legacy-javascript",
      "mainthread-work-breakdown",
      "bootup-time",
      "unused-css-rules",
      "total-blocking-time",
      "largest-contentful-paint",
      "cumulative-layout-shift",
      "total-byte-weight",
      "interactive",
      "first-contentful-paint",
      "speed-index",
      "time-to-interactive",
    ]);
    if (auditId && quick.has(auditId)) return "quick_win";
    if (auditId && heavy.has(auditId)) return "large_project";
    return ["images", "network_caching", "fonts"].includes(area)
      ? "quick_win"
      : "large_project";
  }
  function normalizeIssue(ci) {
    const effort = ci.effort || classifyEffort(ci.audit_id, ci.area);
    const ref_url =
      ci.ref_url ||
      (Array.isArray(ci.affected_urls) && ci.affected_urls[0]) ||
      "";
    const priority = (ci.priority || "low").toLowerCase(); // high|medium|low
    return { ...ci, effort, ref_url, priority };
  }
  function styles() {
    return `
.lh { font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; line-height:1.45; }
.lh h1 { margin:0 0 6px; color:#0b5cab; }
.lh .muted { color:#666; margin:0 0 18px; }
.lh .chips span { display:inline-block; border:1px solid #ddd; border-radius:999px; padding:6px 12px; margin:6px 8px 0 0; font-size:12px; background:#f7f9fc; }
.lh table { border-collapse:collapse; width:100%; margin-top:14px; }
.lh th,.lh td { border:1px solid #eee; padding:10px; vertical-align:top; }
.lh th { background:#f1f5fb; text-align:left; color:#0b2968; }
.lh td.num { text-align:right; }
.lh .pri { font-weight:700; text-align:center; border-radius:6px; }
.lh .pri-high { color:#b00020; background:#ffe6ea; }
.lh .pri-medium { color:#b26a00; background:#fff2d9; }
.lh .pri-low { color:#1b5e20; background:#e8f5e9; }
.lh .eff { white-space:nowrap; font-weight:600; }
.lh .ref a { word-break:break-all; color:#0b5cab; text-decoration:none; }
.lh .ref a:hover { text-decoration:underline; }

/* Overlay shell */
.lh-shell { position:fixed; right:20px; bottom:20px; z-index:999999; width:min(920px, 92vw); max-height:80vh; box-shadow:0 10px 30px rgba(0,0,0,.2); border-radius:12px; overflow:hidden; background:#fff; display:flex; flex-direction:column; }
.lh-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#0b5cab; color:#fff; font-weight:600; }
.lh-header button { background:transparent; border:0; color:#fff; font-size:18px; cursor:pointer; }
.lh-body { padding:16px; overflow:auto; background:#fff; }

/* Print/PDF */
@media print {
  .lh-shell { position:static; width:auto; max-height:none; box-shadow:none; }
  .lh table{ page-break-inside:auto; }
  .lh tr { page-break-inside:avoid; break-inside:avoid; }
  .lh td,.lh th { break-inside:avoid; }
}
`.trim();
  }
  function buildFragment(summary) {
    const mgmt = Array.isArray(summary.management_summary)
      ? summary.management_summary
      : [];
    const issues = (summary.common_issues || []).map(normalizeIssue);
    const chips = mgmt.map((t) => `<span>${esc(t)}</span>`).join("");
    const rows = issues
      .map((c) => {
        const fix = Array.isArray(c.how_to_fix)
          ? c.how_to_fix.join("; ")
          : c.how_to_fix || "-";
        const ref = c.ref_url
          ? `<a href="${esc(c.ref_url)}" target="_blank" rel="noopener">${esc(
              c.ref_url
            )}</a>`
          : "-";
        const priClass =
          c.priority === "high"
            ? "pri-high"
            : c.priority === "medium"
            ? "pri-medium"
            : "pri-low";
        const priText = (c.priority || "").toUpperCase();
        return `<tr>
        <td>${esc(c.area || "")}</td>
        <td>${esc(c.issue_title || "")}</td>
        <td class="pri ${priClass}">${priText}</td>
        <td class="num">${esc(String(c.affected_count ?? ""))}</td>
        <td>${esc(c.why_it_matters || "")}</td>
        <td>${esc(fix)}</td>
        <td class="eff">${esc(c.effort)}</td>
        <td class="ref">${ref}</td>
      </tr>`;
      })
      .join("");
    return `
<div class="lh">
  <h1>Lighthouse Site Analysis Report</h1>
  <p class="muted">Generated: ${esc(
    summary.generated_at || new Date().toISOString()
  )}
   ${summary.version ? "• Version: " + esc(summary.version) : ""}</p>

  <h2>Management Summary</h2>
  <div class="chips">${chips || "<span>No summary points.</span>"}</div>

  <h2>Top Common Issues</h2>
  <table>
    <thead>
      <tr>
        <th>Area</th><th>Issue</th><th>Priority</th><th># URLs</th>
        <th>Why it matters</th><th>How to fix</th><th>Effort</th><th>Ref URL</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="8">No issues found.</td></tr>'}</tbody>
  </table>
</div>`.trim();
  }
  function createOverlayContainer() {
    const host = document.createElement("div");
    host.setAttribute("data-lh-embed", "");
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: "open" });

    const shell = document.createElement("div");
    shell.className = "lh-shell";

    const style = document.createElement("style");
    style.textContent = styles();

    const header = document.createElement("div");
    header.className = "lh-header";
    header.innerHTML = `<span>Lighthouse Report</span><button title="Close" aria-label="Close">✕</button>`;

    const body = document.createElement("div");
    body.className = "lh-body";

    header
      .querySelector("button")
      .addEventListener("click", () => host.remove());

    shell.appendChild(header);
    shell.appendChild(body);
    root.appendChild(style);
    root.appendChild(shell);

    return { host, root, body };
  }
  function ensureTargetShadow(target) {
    let el = null;
    if (typeof target === "string") el = document.querySelector(target);
    else if (target && target.nodeType === 1) el = target;

    if (!el) return createOverlayContainer(); // zero-touch overlay

    if (!el.shadowRoot) {
      const root = el.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = styles();
      root.appendChild(style);
      const body = document.createElement("div");
      body.className = "lh-body";
      root.appendChild(body);
      return { host: el, root, body };
    } else {
      el.shadowRoot.innerHTML = "";
      const style = document.createElement("style");
      style.textContent = styles();
      el.shadowRoot.appendChild(style);
      const body = document.createElement("div");
      body.className = "lh-body";
      el.shadowRoot.appendChild(body);
      return { host: el, root: el.shadowRoot, body };
    }
  }
  function renderInto(summary, opts = {}) {
    const { target } = opts;
    const { body } = ensureTargetShadow(target);
    body.innerHTML = buildFragment(summary);
  }
  async function render(opts = {}) {
    const { json, jsonUrl = "reports/summary_report.json", target } = opts;
    let summary = json;
    if (!summary) {
      const res = await fetch(jsonUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${jsonUrl}: ${res.status}`);
      summary = await res.json();
    }
    renderInto(summary, { target });
  }

  // Auto-boot if script tag has data-json attribute (zero-touch overlay)
  try {
    const cur = document.currentScript;
    if (cur && cur.dataset && cur.dataset.json) {
      render({ jsonUrl: cur.dataset.json }).catch(console.error);
    }
  } catch (_) {}

  global.LHEmbed = { render, _buildFragment: buildFragment };
})(window);
