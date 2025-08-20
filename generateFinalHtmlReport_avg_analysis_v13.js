// generateFinalHtmlReport_avg_analysis_v13.js
// E2E v13
// - Header layout fixed (facts block below header)
// - Centered "View Detailed Analysis Report →" button
// - SHOW_ACCESSIBILITY_COLUMN toggle
// - Metrics explainer above table
// - Modal "Issues by URL" page (Desktop first, then Mobile)
// - Normalizes 0–100 metrics to 0–1 for modal UI
// - Enables Accessibility + SEO in modal UI
// - Embeds summary_report.json for file://
// - Filters malformed analysis keys

"use strict";

const fs = require("fs");
const { execSync } = require("child_process");

// ======= CONFIG FLAGS =======
const SHOW_ACCESSIBILITY_COLUMN = true; // set false to hide Accessibility column

// If your PDF generator path differs, adjust below:
const {
  generatePdfReportFromData,
} = require("./components/generate_Pdf_Report_From_Data_v12NA.js");

// Tiny placeholder image (so file:// works anywhere)
const logo =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxIHEhAQDxAVEBMWFxYbFxUWGBYVEBsSHRgiGxoYGRkeIDQgHh8mIBkZITIhMSstLy4vIyIzODM4NyktLi8BCgoKDQ0OGxAQGSslHyUyNzc3Ny03NzU3Nys3LzU1MTg3LTcyNis1KyssNzc2LSsyLS44LTg1NywrOC0tKy0rLf/AABEIAJYBLAMBIgACEQEDEQH/xAAcAAEAAgIDAQAAAAAAAAAAAAAABwgFBgIDBAH/xABSEAABAwIDAwYFDgoJBAMAAAABAAIDBBEFBhIHITETMkFRYXEIgZGT0RQXIiM1QlJicnShsbPSFRZDREVUVaLB8FNjgoOEkrLD4iVz4eMkMzT/xAAaAQEAAgMBAAAAAAAAAAAAAAAAAgUBAwYE/8QAJREBAAEDBAEDBQAAAAAAAAAAAAECAxEEBRIhMRMiQRVhcZGh/9oADAMBAAIRAxEAPwCcUREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERARF4J8Yp6ZxZJURMcOLXPa1w7wSjMUzPiHvRcWuDgCN4XJGBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFDudMp1tfWVE0UBcxxFnam7wGgcL9imJaRje0KLCppYDA9zmG1w4AFQr447WO23NRRcmbFPKcfxkMKzZR6YYOXHKWYzTZ3P3C3C3FbOq9YG7lKynda15mH98Kwqjar5RKe6aKjS1UxTM9xnsREW1ViIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICItH2mZlny62mNM5oLy/Vdodw02+srEzhtsWar1cW6fMuOb89Oy9UcgIWvGlrrkkHeouxjETi08s5bpLzfSN9l04xjMuOyctUEOfYDcA0WC6IxwXku1TU7Pb9Fb09ETj3Y7ZTL4/wDlU3/dj/1BWEWlyZVpMPpzUxRaZWR62u1PPsw3UDYm3FYTJudKrFqyKCVzSx2u9mgHc0kb/Etlr2dT8qfXzO4RN61HVETnKT0RF6HPix+M4zT4HGZqqZsLB0uPE9TRxJ7AvPmnMEWWKaSqnPsW8GjnOeeawdp+jeehVYzVmaozVO6epeT8Fg5jGfBaP5ugl7GtusMRLaOldIPhyHQPEwXP0hYMbdKu/wD+aC3VaS/+tadlfZ9X5nAfBDpiP5WQ6I/F0u8QK22XYZXMbdtTTud8G8gHiOlBseCbcYJyG1lM6G/v4zraO9psfJdSjheKQ4xGJqaVs0Z4Oabi/Ueo9hVWcyZNrcs76qAtYTYSNIdET8ocO42K68qZoqMqTCamfu3a4z/9b29Th/HiEFt1q+0DNwyXTsqTCZw6UR6Q/Ra7XOvfSfg8O1ZLLGPRZlpo6qnPsXDe085rxzmu7QtE8IX3Oh+cs+zkQYj1+mn9HHz3/rT1+m/s8+e/4KI8AwmTHZ4qWC3KSEhuo2buBO89wW7nYrifXT+cP3UGy+v039nnz3/BPX7b+zj57/gtYOxXE/6jzh+6vnrLYp/UecP3UEkZC2pjOFV6kFIYfYOfr5TXzbbraB1ru2gbTm5MqGUxpTPqja/UJNHFzm2tpPwfpWA2V7N63K1camq5LRyT2+weXO1Ettut2Fav4Qg/6lD82Z9pIg2L1+2fs53nh9xfRt6j/Z7vPD7ijLKOT6nNxlbShl4w0u1u0869vqK2J2xnFB72E/3n/hBv2GbcKGpIE8E8HxrNkZ9Bv9C3/A8wUuYGcpSTsmA46TZw+U07x4wqz45s+xLAmmSeldyY4vYWyNA6zpJIHesLg2Lz4HK2emkdFI3pHT2EdI7CguMi1HZznNmcafXYMnjsJYxwB6HN+KbHu3hbcgIiwWcsxx5VpZaqSxI3MZwL5TzW/wAT2AoNcz/tQgybMyn5E1MhGp7WvDNDTzbmx3nq6u8L17OtoDc8+qNNO6DkeT4vD769XYLc1VlxStkxaWWoncXySOLnOPWf4KYfBrFvwn/h/wDcQTcsFmjNlJlZgfVyhhPNYPZSu+S3+JsFkMZxFmEwTVMnNiY557dIvbx8FUXMGNy5hqJamodqe837Gt6Gt6gEEv123pgdaChc5vXJIGkjuANvKszl3bTRYk4MqY30hPvieUhv2kC48i0fLGxipxeBk887aXWAWsLC9+k8C7eNPctYzpkepyc9rZ7PjffRK3mOt0dh7PrQWpgnbUta+Nwe1wu1zSC0jrBG4rtUD7CM1vp5zh0ryY5ATFc82UC5A7HC/jHap4QadtTrpKChMkL3Ru5Rg1NJBtv6lCddi8+K6fVEz5dN9Otxda/G11N20/DpcUoXRU8ZlfrYdLeNgoSxLBKnBtHqmF0Wq+nUONuKjU6TaPT9PvHLM/l0tKnHJVFTSUNO58cJcWm5IYXXueJUFNK5aui61R0sdZpp1FEUxVxxLYK7MdS8yR+qHllyLajp09Vli6asfRuEkTzG8cHNNnDxry6l3UVLJiD2xQsMj3Xs0cTYXKhiZl64i3RRMYiI+UkbKcaqMSqZmTzyStERIDnFwvraL7+9Soos2U4DU4XUzPqIHxNMRALhYatTTb6FKa9FGePbj9zm3Oon08Y68K87fcfdW1rKJp9rp2guHQZnjUT4mlo8ZXg2N5LbmaodNUN1U8FiWng+Q81p7NxJ8XWsJtKcZMVxAn+mcPENw+gKXNh9XT4XhjnTTRRF08hOt7We9aBxPYpK9KMbBGAGgAAWAG4AdQXNY+lxulqzaKqhkPU2Rjj9BWQQdNXSsrWOjlY2RjhZzXC7SOohVp2qZOGUqkclf1PMC6K+8tI5zL9Nrjf1EKzijLwgKZsuHRyHnMnZY9NnNcCPq8iDTNgePmjq5KJx9rnaXNHVMwX+loPkC3HwhPc6H5yz7KRQ/s0lMOKYeR0zNHid7E/QVL/hC+50Pzln2ciCKdkfuvQfKk+ycrTKmlDVPoHtlhe6ORu9r2mzgewrLuzxif7QqPOP9KC2iKpRzziZ/SFR5x/pXz8ecTH6QqPOO9KC2yrv4QnulD82Z9pIs3sJzFWYzV1LKqplna2G4a9xcA7WBcXWE8Ib3Rg+bM+0egy/g4n2eIfJh+t6nFQd4OHPxD5MP1vU4oPhGriq9baMltwGVlXTt0wTEhzQLNZNxsOoOFz4j2Kwy0jbLAJsIqy73picD1HlWj6iUEKbJMZdg2J02+zJjyTx0EP3N8j9JVolTfBJTDU0zhxEsZHeHhXIQcSQ3edwVYtrOc/xqq9ELiaaG7Y+pzvfSePgOwDrKknblnT8EQ+oIHWmmb7YRxbAejvdvHdfrCjjY/k38aKrlJm3pobOffg5/vY/HxPYO1BruM4BLg0dM6YaXTx8oGEWIj1ENJ77X8ilLwbf0l/h/wDcWL8IU2racdVO3/W9ZPwbeOJf4f8A3EEh7TsNqcXw6eno2cpLIYxp1Nb7EPBdvcQOhQtlvZXicVXSuqaK0LZozITLCRyYeC7cH79ysoiAo527uYMM9nbVy0ejr1WN7f2dS3zEa6PDI3zTvEcbBdzjwA/no6VWTaVnd+cJ7tuynjuImHj2vd8Y/Qg8Gz55ZieHlvHl4h4i8A/RdW0Vf9hGVnVtSa+RtoobhhPvpiLbvkg37y1WAQFGm2WjfWNo9Ntxl4/2VJaweZsvjHhGDJyegk83Ve9u0dSNti9VZriunzCCoMuTS8Czyn0LItyRVPBcNFh8ZbjiWD/gWZsevXdode2npI6+xZWA+1v8ajwhY/WdT9v0iyfL01Pudp8qzmzXD3wYjA42sBJwP9W5ZOsi9USBt+JAW4YBkz8ETNn5bWWg7tNuII437ViKIhC5u2ouUTROMS25ERTVis+2jCjhuKTPt7GcMkaf7Ol37zT5VptLSPrnNjhY6R7twawFzyewDeVZDa1k85qpLwtvUQ3dH1ub76Px2Fu0DrVbqOqkw2RskbnRSsNw4Xa9rgg99VlSvphqkoqho6zDJb6l3YLm+vy6QIKmWMD8m46ov8jtylbJ+2iKRrY8SY5jxu5ZgvGe1zRvB7r+JZjM5wDNsbnS1VOyQjdM1zY6gHtB3u7iEHnyBtbix5zaeta2nnNg14PtL3dW/mnotvB+hYrwhMcbydNQsddxdyrx1NALWeW7vIoexWkZRSyRxTNnY1xDZG3DXDoO9dNTO+qcXyPdI42u5xLnbhYbyg2/YxhhxHFad1rthD5HHqs0hv7zmqTfCF9zofnTPspFw2NMw/BKVp9WQGqqNJe0yMEg+DEGk33X8p7lz8Ib3Og+dM+ykQQ5s/wyPG8QpKacF0cjnBwBLTYMc7iO5TsdkGEn8g/zsnpUE7PcTjwTEKSpnJbGxztRALiAWObwHep5O1vCR+cO81L91B1es7hP9BJ52T0ridjeEn8jJ5167vXdwn9Yf5qT0L6NrmE/rLvNS/dQZPKuRKLKj5JaRj2ue3S7U8uGm9+lQ74Q3ulB82Z9pIphy9n7D8xS+p6Wcvk0l2kse32I47yLKH/CGH/UoPmrPtZEGY8HAezxD5MP1vU4Ku+xXNVJll1X6sl5ISCPSdL3X0l1+aD8IKUX7V8IZ+dk90U33UG7qK9vuPNpKRlEDeSdwcR1RMN7nvcB5CunH9uFNTtIoYHzv6HSe1xDttzj3blCmPYzNj8z6mpfrkd4mgdDWjoAQe3ImGnFsRooWi95mF3yGnW791pVos045HlylmqpeDG7m8C553NaO82UZ7CMnuo2uxKdpa57dMIPHkzzpPHwHZfrWd2600lXhobDG+R3LxmzGlzraXb7DxIK/V9XNmerMkr28rPILucdMYJNhvPNaN3cArMZObh+VqSKlirKc6Rd7uVju+Q853H+QAqzMwSq/VJ/NSehcvwFVfqk/mpPQg3vbxWxV9bCYZWSgQNBLHB4B1u3GyyPg+4jDhzsQE80cOoQaeUe1l7a72ud/EKLKimfSHTKx0brXs4Fpt41xiopa2/IxPk08dDXOt32WRcqGVtQ0PY4PaRcOabtI6wV5cXxSHBon1FRII42C5cfqHWTwsteyzXR5cwakmqrxMipoi+4OsEgbrdZJAt2qBNoGep85y3deOnYfa4QeHxn9bvq6O3A7to20GbOEmlt4qZh9hHfefjv63dnR5SfVs22cTZrcJpbw0oO9/v3297H97gFj9n2EUFbLyuKVTIYWEe1ku1yO6tw3N6+lT3T7QMHpWtjjrYWNaAGtaHBoaOAA0oNkw3D48LiZBAwRxsFmtHAD09vSvWtboc94biEjIYa2N8jyA1o1XLjwA3LZEBERBi8RwOLEXiSTVqAA3G27+SsJWU4pOUY29he1+PBbetXxfnzfz0IPRFlWnJa8677jzt1/ItgXCHmt7guaAiIgKPc+7LqfMxdPARTVJ3lwF4nn47eg/GHjupCRBVPH8hYjgLiJaV7mD8pGOUi77jh47LCNw+Y8IX/AOUq46+cUFVsGyFiWMFvJUkjWn38g5OO3Xd3HxXWx5h2O1mFwtlhe2rcB7ZGwEPHyL88eQ9isMvqCn+FUklJWUokY6MiaLc4Fp5461Pm27BqjHKGGKkhdO8VDXFrd5DRG8X8pCkJzQ/iAVyQVOGRcUH6OqP8hXE5FxT9n1Hm3K2aIKlOyPibeOHVPmnn+C63ZOxFv6PqfMyehW5RBXzYrgFXhuJtfPSTQs5KQanxvay+7dchenbxg1TiGIQvgppZminYC5kb3t1cpJuuBx3gqekQVB/Fmu/UajzMnoX0ZWr3cKGpP91J6Fb1EFUsP2e4pXkBlDK2/TIOTb5X2UoZJ2NR0Dmz4k5s7xvELd8IPxyef3cO9S6iDixoYABuA4DoXJEQEREEIbb8r1uNVsMtJSyTsEDWlzBca9bzbyELJbBsv1eCOrjV08kGsQhusab213t5QpdRBpu1ymkrMJq44WOkeeSs1oLnG0zCbAb+Auq4R5Yrj+Y1HmpPQrgpZBUL8V68/mNT5qT0L5+KtefzCp8zJ6Fb6yWQVh2e5YrafEqGSSjqI2NlaXOdFI1oA6SSNys8lkQEREBa5idK+R8ulhN+C2NEHCIWA7guaIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIg//9k=";
// Per-URL Lighthouse-style Issues section renderer (our new analysis UI)
const {
  renderPerUrlIssuesSection,
} = require("./analysis/components/render_PerUrl_Issues_Section_v1.js");

// ---- helpers to read inputs ----
const getSummaryData = () => {
  try {
    const data = fs.readFileSync("lhci-summary.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading lhci-summary.json:", error);
    return [];
  }
};
const getConfigData = () => {
  try {
    return JSON.parse(fs.readFileSync("githubconfigsFile.json", "utf8"));
  } catch (e) {
    console.warn("githubconfigsFile.json not found; using defaults");
    return {
      projectName: "Internal",
      client: "Internal",
      projectManager: "",
      qaManager: "",
      expectedLoadTime: "3 seconds",
    };
  }
};
const getAnalysisData = () => {
  try {
    return JSON.parse(fs.readFileSync("lighthouse-analysis-data.json", "utf8"));
  } catch (e) {
    console.error("Error reading lighthouse-analysis-data.json:", e);
    return {};
  }
};

// embed summary_report.json into HTML to avoid file:// CORS
function readSummaryJSONForEmbed() {
  const candidates = [
    "summary_report.json",
    "./summary_report.json",
    "reports/summary_report.json",
    "./reports/summary_report.json",
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const txt = fs.readFileSync(p, "utf8");
      JSON.parse(txt); // validate
      return txt;
    } catch (_) {}
  }
  return null;
}
function escapeForScriptTag(s) {
  return String(s).replace(/<\/script>/gi, "<\\/script>");
}

// --- pipeline steps ---
const runProcessConfig = () => {
  try {
    execSync("node processConfig.js", { stdio: "inherit" });
  } catch (error) {
    console.error("Error running processConfig.js:", error);
    process.exit(1);
  }
};
const runLighthouseAnalysis = () => {
  try {
    console.log("Generating Lighthouse analysis data...");
    execSync("node generateLighthouseAnalysis.js", { stdio: "inherit" });
    console.log("Lighthouse analysis completed successfully.");
  } catch (error) {
    console.error("Error running generateLighthouseAnalysis.js:", error);
  }
};

// ---- page renderer ----
const siteDesktopAvgPerf = [];
const siteMobileAvgPerf = [];
const siteDesktopSEO = [];
const siteMobileSEO = [];
const siteMobileAccessibility = [];
const siteDesktopAccessibility = [];

const generateFinalHTMLReport = (summaryData, configData, analysisData) => {
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-");
  const filename = `lighthouse-metrics-report-${dateString}.html`;

  const getPassFailColor = (s) => (s >= 0.9 ? "green" : "red");
  const getPct = (s) => (s * 100).toFixed(0) + "%";
  const getPerfDesktopColor = (s) => (s >= 0.9 ? "#006400" : "red");
  const getPerfMobileColor = (s) => (s >= 0.8 ? "#006400" : "red");

  // ---------- Group for main table ----------
  const grouped = summaryData.reduce((acc, e) => {
    if (!e || !e.url) return acc;
    acc[e.url] ||= { desktop: [], mobile: [] };
    if (e.runType === "desktop") acc[e.url].desktop.push(e);
    else if (e.runType === "mobile") acc[e.url].mobile.push(e);
    return acc;
  }, {});
  const urls = Object.keys(grouped).sort();

  // ---------- Build perUrlList for modal UI ----------
  function isValidAnalysisKey(k) {
    if (!k || typeof k !== "string") return false;
    const idx = k.lastIndexOf("_");
    if (idx <= 0) return false;
    const url = k.slice(0, idx);
    const device = k.slice(idx + 1);
    if (!/^https?:\/\//i.test(url)) return false;
    if (!["desktop", "mobile"].includes(device)) return false;
    const d = analysisData[k];
    return d && d.metrics && Number.isFinite(d.metrics.performance);
  }
  const analysisKeys = Object.keys(analysisData || {}).filter(
    isValidAnalysisKey
  );

  // normalize 0–100 → 0–1
  const norm = (v) => (typeof v === "number" && v > 1 ? v / 100 : v);

  const perUrlList = analysisKeys.map((k) => {
    const idx = k.lastIndexOf("_");
    const url = k.slice(0, idx);
    const device = k.slice(idx + 1);
    const d = analysisData[k] || {};
    const m = d.metrics || {};
    return {
      url,
      device,
      analysisDate: d.analysisDate || d.generatedAt || new Date().toISOString(),
      metrics: {
        performance: norm(m.performance),
        accessibility: norm(m.accessibility),
        bestPractices: norm(m.bestPractices),
        seo: norm(m.seo),
        lcp: m.lcp,
        fcp: m.fcp,
        cls: m.cls,
        tbt: m.tbt,
      },
      issues: d.issues || {},
      // reportPath: d.reportPath,
    };
  });

  // Render modal UI HTML
  const perUrlHTML = perUrlList.length
    ? renderPerUrlIssuesSection(perUrlList, {
        includeAccessibility: true,
        includeSEO: true,
      })
    : '<div style="padding:12px;color:#ccc;">No per-URL analysis available.</div>';

  // try to inline site summary JSON
  const embeddedSummaryJSON = readSummaryJSONForEmbed();

  // ---------- Build HTML ----------
  let html = `
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lighthouse Metrics Report</title>
  <style>
    :root {
      --overlay-bg: rgba(11,14,20,0.85);
      --panel-bg: #0f1117;
      --panel-fg: #e8e8e8;
      --panel-border: #2a2d34;
      --focus-ring: 2px solid #6ea8fe;
      --accent-grad: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    body { font-family: Georgia, 'Times New Roman', Times, serif; color:#111; margin: 8px; }
    table { width: 100%; border-collapse: collapse; overflow-y: auto; display: block; margin-bottom: 30px; }
    th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
    th { background-color: #f2f2f2; position: sticky; top: 0; z-index: 1; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    tr:nth-child(odd) { background-color: #fff; }
    .desktop { background-color: #d4edda; }
    .mobile { background-color: #f8d7da; }
    .average-column { background-color: #e9ecef; font-weight: bold; color: #343a40; border: 2px solid black; }
    .average-row { border: 2px solid black; }

    /* Header row (logo, title, org) */
    .header-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .brand { display:flex; align-items:center; gap:12px; min-width:220px; }
    .brand img { width:200px; height:100px; object-fit:contain; background:#fff; border:1px solid #eee; }
    .title { text-align:center; font-size:34px; font-weight:700; flex:1; }
    .org { min-width:220px; text-align:right; }

    /* Facts block sits BELOW header, left-aligned (like your expected screenshot) */
    .facts-block { margin:10px 10 12px; font-size:14px; line-height:1.5; margin-top: 30; }

    /* Button centered */
    .cta-wrap { display:flex; justify-content:center; margin:16px 0 12px; }
    .analysis-link { display:inline-flex; align-items:center; gap:10px; padding:16px 28px; border-radius:12px; font-weight:700; text-decoration:none; border:1px solid #764ba2; background: var(--accent-grad); color:#fff; }
    .analysis-link:hover { opacity:.95 }
    .analysis-link:focus { outline: var(--focus-ring); outline-offset: 3px; }

    .metric-explainer { margin:16px 0; padding:12px; background:#f8f9fa; border-radius:8px; font-size:14px; line-height:1.5; }

    /* Modal */
    .modal { display:none; position:fixed; inset:0; z-index:1000; background: var(--overlay-bg); backdrop-filter: blur(2px); }
    .modal-content { background: var(--panel-bg); color: var(--panel-fg); margin: 2% auto; padding: 20px; border: 1px solid var(--panel-border); border-radius: 12px; width: 92%; max-width: 1280px; max-height: 92%; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,.4); }
    .modal-titlebar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .modal-titlebar h2 { margin:0; font-size:1.1rem; letter-spacing:.2px; }
    .close { appearance:none; border:1px solid var(--panel-border); background:#171a21; color:#e8e8e8; border-radius:8px; padding:8px 12px; font-size:14px; cursor:pointer; }
    .close:hover { filter: brightness(1.05); }
    .close:focus { outline: var(--focus-ring); outline-offset: 2px; }
    .toolbar { display:flex; align-items:center; gap:10px; margin: 10px 0 20px; }
  </style>
</head>
<body>
  <div id="mainReport">
    <!-- Header -->
    <div class="header-row">
      <div class="brand">
        <img src="${logo}" alt="Logo">
      </div>
      <div class="title">Lighthouse Metrics Report</div>
      <div class="org">QED42 Engineering Pvt. Ltd.</div>
    </div>

    <!-- Facts block (left-aligned, below header) -->
    <div class="facts-block">
      <div><strong>Project Name:</strong> ${configData.projectName || ""}</div>
      <div><strong>Client:</strong> ${configData.client || ""}</div>
      <div><strong>Project Manager:</strong> ${
        configData.projectManager || ""
      }</div>
      <div><strong>QA Manager/Lead:</strong> ${configData.qaManager || ""}</div>
      <div><strong>Audit Date:</strong> ${
        new Date().toISOString().split("T")[0]
      }</div>
      <div><strong>Expected Time of Site Load:</strong> ${
        configData.expectedLoadTime || ""
      }</div>
      <div><strong>Report Date:</strong> ${new Date().toISOString()}</div>
    </div>

    <!-- Centered CTA button -->
    <div class="cta-wrap">
      <a href="#" class="analysis-link" onclick="openAnalysis();return false;">📊 View Detailed Analysis Report →</a>
    </div>

    <!-- Short explainer block ABOVE table -->
    <div class="metric-explainer">
      <strong>About these metrics:</strong>
      <br/><b>LCP (Largest Contentful Paint)</b>: Loading speed of the main content (lower is better).
      <br/><b>FCP (First Contentful Paint)</b>: Time until the first text or image appears (lower is better).
      <br/><b>TBT (Total Blocking Time)</b>: Main-thread blocking that delays interactivity (lower is better).
      <br/><b>CLS (Cumulative Layout Shift)</b>: Visual stability—unexpected shifting of elements (lower is better).
      <br/><b>SI (Speed Index)</b>: How quickly the page visually populates during load (lower is better).
    </div>

    <table>
      <thead>
        <tr>
          <th style="background:#87CEEB;color:black;font-weight:bold;">Score Type</th>
          <th>URL</th>
          <th class="average-column">Performance</th>
          <th class="average-column">SEO</th>
          ${SHOW_ACCESSIBILITY_COLUMN ? `<th>Accessibility</th>` : ``}
          <th>Largest Contentful Paint</th>
          <th>First Contentful Paint</th>
          <th>Total Blocking Time</th>
          <th>Cumulative Layout Shift</th>
          <th>Speed Index</th>
        </tr>
      </thead>
      <tbody>`;

  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // per-URL rows
  urls.forEach((url) => {
    const entries = grouped[url];

    const dPerf = avg(
      entries.desktop.map((e) => e.categories?.performance || 0)
    );
    const mPerf = avg(
      entries.mobile.map((e) => e.categories?.performance || 0)
    );
    const dSEO = avg(entries.desktop.map((e) => e.categories?.seo || 0));
    const mSEO = avg(entries.mobile.map((e) => e.categories?.seo || 0));
    const dAcc = avg(
      entries.desktop.map((e) => e.categories?.accessibility || 0)
    );
    const mAcc = avg(
      entries.mobile.map((e) => e.categories?.accessibility || 0)
    );

    const calcAudit = (arr, auditName) => {
      const nums = arr.map((e) => {
        const raw = e?.audits?.[auditName];
        const v = parseFloat(String(raw || "").replace(/[^\d.]/g, ""));
        return isNaN(v) ? 0 : v;
      });
      return avg(nums).toFixed(1);
    };

    siteDesktopAvgPerf.push(dPerf);
    siteMobileAvgPerf.push(mPerf);
    siteDesktopSEO.push(dSEO);
    siteMobileSEO.push(mSEO);
    siteDesktopAccessibility.push(dAcc);
    siteMobileAccessibility.push(mAcc);

    if (entries.desktop.length) {
      html += `
      <tr class="desktop average-row">
        <td style="color:#800080;font-weight:bold;">Desktop</td>
        <td>${url}</td>
        <td class="average-column" style="color:${getPerfDesktopColor(
          dPerf
        )};">${getPct(dPerf)}</td>
        <td class="average-column" style="color:${getPassFailColor(
          dSEO
        )};">${getPct(dSEO)}</td>
        ${
          SHOW_ACCESSIBILITY_COLUMN
            ? `<td style="color:${getPassFailColor(dAcc)};">${getPct(
                dAcc
              )}</td>`
            : ``
        }
        <td>${calcAudit(entries.desktop, "largestContentfulPaint")} s</td>
        <td>${calcAudit(entries.desktop, "firstContentfulPaint")} s</td>
        <td>${calcAudit(entries.desktop, "totalBlockingTime")} ms</td>
        <td>0.10</td>
        <td>${calcAudit(entries.desktop, "speedIndex")} s</td>
      </tr>`;
    }

    if (entries.mobile.length) {
      html += `
      <tr class="mobile average-row">
        <td style="color:#1976D2;font-weight:bold;">Mobile</td>
        <td>${url}</td>
        <td class="average-column" style="color:${getPerfMobileColor(
          mPerf
        )};">${getPct(mPerf)}</td>
        <td class="average-column" style="color:${getPassFailColor(
          mSEO
        )};">${getPct(mSEO)}</td>
        ${
          SHOW_ACCESSIBILITY_COLUMN
            ? `<td style="color:${getPassFailColor(mAcc)};">${getPct(
                mAcc
              )}</td>`
            : ``
        }
        <td>${calcAudit(entries.mobile, "largestContentfulPaint")} s</td>
        <td>${calcAudit(entries.mobile, "firstContentfulPaint")} s</td>
        <td>${calcAudit(entries.mobile, "totalBlockingTime")} ms</td>
        <td>0.10</td>
        <td>${calcAudit(entries.mobile, "speedIndex")} s</td>
      </tr>`;
    }
  });

  const siteDP = avg(siteDesktopAvgPerf);
  const siteMP = avg(siteMobileAvgPerf);
  const siteDS = avg(siteDesktopSEO);
  const siteMS = avg(siteMobileSEO);
  const siteDA = avg(siteDesktopAccessibility);
  const siteMA = avg(siteMobileAccessibility);

  const avgCol = (s) =>
    s >= 0.9 ? "#006400" : s >= 0.5 ? "#b8860b" : "#8b0000";

  html += `
  <tr><td colspan="${
    SHOW_ACCESSIBILITY_COLUMN ? 3 : 2
  }" style="color:#800080;font-weight:bold;border:2px solid black;">Total site average Performance for Desktop 🖥️</td>
      <td class="average-column" style="color:${getPerfDesktopColor(
        siteDP
      )};">${getPct(siteDP)}</td></tr>
  <tr><td colspan="${
    SHOW_ACCESSIBILITY_COLUMN ? 3 : 2
  }" style="color:#1976D2;font-weight:bold;border:2px solid black;">Total site average Performance for Mobile 📱</td>
      <td class="average-column" style="color:${getPerfMobileColor(
        siteMP
      )};">${getPct(siteMP)}</td></tr>
  <tr><td colspan="${
    SHOW_ACCESSIBILITY_COLUMN ? 3 : 2
  }" style="color:#800080;font-weight:bold;border:2px solid black;">Total site average SEO for Desktop 🖥️</td>
      <td class="average-column" style="color:${avgCol(siteDS)};">${getPct(
    siteDS
  )}</td></tr>
  <tr><td colspan="${
    SHOW_ACCESSIBILITY_COLUMN ? 3 : 2
  }" style="color:#1976D2;font-weight:bold;border:2px solid black;">Total site average SEO for Mobile 📱</td>
      <td class="average-column" style="color:${avgCol(siteMS)};">${getPct(
    siteMS
  )}</td></tr>
  ${
    SHOW_ACCESSIBILITY_COLUMN
      ? `
  <tr><td colspan="3" style="color:#800080;font-weight:bold;border:2px solid black;">Total site average Accessibility for Desktop 🖥️</td>
      <td class="average-column" style="color:${avgCol(siteDA)};">${getPct(
          siteDA
        )}</td></tr>
  <tr><td colspan="3" style="color:#1976D2;font-weight:bold;border:2px solid black;">Total site average Accessibility for Mobile 📱</td>
      <td class="average-column" style="color:${avgCol(siteMA)};">${getPct(
          siteMA
        )}</td></tr>`
      : ``
  }
  </tbody></table>

  <!-- Site-wide Common Issues (summary) -->
  <section id="site-common-issues" style="margin:24px 0;">
    <h2 style="margin:0 0 10px;">Site-wide Common Issues (Summary)</h2>
    <table style="width:100%; border-collapse:collapse;">
      <tbody><tr><td style="padding:0; border:1px solid #ddd;">
        <div id="lh-embed-container" style="padding:12px;"></div>
      </td></tr></tbody>
    </table>

    ${
      embeddedSummaryJSON
        ? `<script type="application/json" id="lh-summary-json">${escapeForScriptTag(
            embeddedSummaryJSON
          )}</script>`
        : ""
    }

    <script>
      (function () {
        var EMBED_SRC = (location.protocol === 'file:') ? './lh-embed.js' : '/lh-embed.js';

        function loadScript(src, done) {
          var s = document.createElement('script');
          s.src = src;
          s.onload = done;
          s.onerror = function () {
            if (src === '/lh-embed.js') loadScript('lh-embed.js', done);
            else {
              var div = document.getElementById('lh-embed-container');
              if (div) div.innerHTML =
                '<div style="padding:12px;color:#b00020;background:#ffe6ea;border:1px solid #f5c2c7;border-radius:8px">Could not load <code>lh-embed.js</code>. Place it next to this HTML or serve it at /lh-embed.js</div>';
            }
          };
          document.currentScript.parentNode.appendChild(s);
        }

        function renderNow() {
          var inline = document.getElementById('lh-summary-json');
          if (inline && inline.textContent.trim()) {
            try {
              var data = JSON.parse(inline.textContent);
              window.LHEmbed.render({ json: data, target: '#lh-embed-container' });
              return;
            } catch (e) { console.warn('Inline JSON parse failed', e); }
          }
          var candidates = (location.protocol === 'file:')
            ? ['summary_report.json','./summary_report.json','reports/summary_report.json','./reports/summary_report.json']
            : ['/reports/summary_report.json','reports/summary_report.json'];

          (async function () {
            for (var i=0;i<candidates.length;i++) {
              try {
                await window.LHEmbed.render({ jsonUrl: candidates[i], target: '#lh-embed-container' });
                return;
              } catch (e) { console.warn('LHEmbed failed with', candidates[i], e); }
            }
            var div = document.getElementById('lh-embed-container');
            if (div) div.innerHTML =
              '<div style="padding:12px;color:#b00020;background:#ffe6ea;border:1px solid #f5c2c7;border-radius:8px">Could not load <code>summary_report.json</code>. Place it next to this HTML or in <code>./reports/</code>.</div>';
          })();
        }

        loadScript(EMBED_SRC, renderNow);
      })();
    </script>
  </section>
`;

  // Close the mainReport wrapper
  html += `
  </div><!-- /mainReport -->`;

  // Modal (hidden by default) – “Issues by URL” page with dark theme
  html += `
  <div id="analysisModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="analysisModalTitle" aria-describedby="analysisModalDesc">
    <div class="modal-content">
      <div class="modal-titlebar">
        <h2 id="analysisModalTitle">Issues by URL</h2>
        <div class="toolbar">
          <button class="close" onclick="closeModal()" aria-label="Close detailed analysis">Close ×</button>
        </div>
      </div>
      <p id="analysisModalDesc" style="margin-top:0; opacity:.8;">Detailed Lighthouse-style analysis with Performance, Accessibility, Best Practices, and SEO issues per URL.</p>
      ${perUrlHTML}
    </div>
  </div>

  <script>
    // Open/Close modal (accessible)
    function openAnalysis(){
      var m = document.getElementById('analysisModal');
      if(!m) return;
      m.style.display = 'block';
      document.body.style.overflow = 'hidden';
      var title = document.getElementById('analysisModalTitle');
      if (title) title.tabIndex = -1, title.focus();
    }
    function closeModal(){
      var m = document.getElementById('analysisModal');
      if(!m) return;
      m.style.display = 'none';
      document.body.style.overflow = '';
      var btn = document.querySelector('.analysis-link');
      if (btn) btn.focus();
    }
    window.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });
    window.addEventListener('click', function(e){ var m = document.getElementById('analysisModal'); if (e.target === m) closeModal(); });
  </script>
</body>
</html>`;

  fs.writeFileSync(filename, html);
  console.log(`✅ Enhanced report saved as ${filename}`);
};

// ---- run pipeline ----
async function main() {
  console.log("Starting enhanced Lighthouse report generation (v13)...");
  runProcessConfig();
  runLighthouseAnalysis();

  const summaryData = getSummaryData();
  const configData = getConfigData();
  const analysisData = getAnalysisData();

  generateFinalHTMLReport(summaryData, configData, analysisData);
  await generatePdfReportFromData(logo, summaryData, configData, analysisData);
}

main().catch((e) => console.error("Error during report generation:", e));
