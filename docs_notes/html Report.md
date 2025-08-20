Alright — here’s a **step-by-step README** for `generateFinalHtmlReport_avg_analysis_v12AI.js` so you can see what’s going on under the hood and know where to debug in future.

---

# **README — Lighthouse HTML Report Generator (v12AI)**

## **Purpose**

This script generates a **single HTML report** combining:

* Lighthouse score tables and averages (**main table**)
* A new **Summary section** (management summary + site common issues)
* Analysis data from **new prioritized JSON** (`per_url_prioritized.json`) or fallback to the old JSON (`lighthouse-analysis-data.json`).

It’s designed to integrate with your **new pipeline outputs**:

1. `analysis.js` → `per_url_prioritized.json` + `site_common_issues.json`
2. `summary.js` → `summary_report.json`

---

## **File Flow Overview**

```
.lighthouseci/*.json   → analysis.js → per_url_prioritized.json, site_common_issues.json
                           summary.js → summary_report.json
generateFinalHtmlReport_avg_analysis_v12AI.js → HTML report
```

---

## **Main Functions**

### **1. getSummaryReport()**

```js
function getSummaryReport() { ... }
```

* Reads `summary_report.json` from disk.
* Returns `null` if file doesn’t exist or JSON parse fails.
* Used for **Management Summary** bullets and fallback **Site Common Issues**.

---

### **2. getSiteCommonIssues()**

```js
function getSiteCommonIssues() { ... }
```

* Reads `site_common_issues.json` from disk.
* Returns `null` if not found.
* Preferred source for the **Site Common Issues** list in the summary section.

---

### **3. getAnalysisData()**

```js
function getAnalysisData() { ... }
```

* **Prefers** `per_url_prioritized.json` (new prioritized issues per URL).
* **Falls back** to `lighthouse-analysis-data.json` (old format).
* This data powers the “Analysis” modal/page in the HTML.

---

### **4. getSummaryData()**

```js
function getSummaryData() { ... }
```

* Reads `lhci-summary.json` (from Lighthouse CI runs).
* Used to build the **main scores table**.

---

### **5. getConfigData()**

```js
function getConfigData() { ... }
```

* Reads `githubconfigsFile.json` (your metadata/config for the report).
* Can be used in headings, meta-info, or table context.

---

### **6. buildMainTable(summaryData)**

```js
function buildMainTable(summaryData) { ... }
```

* Creates the HTML `<table>` for all URLs + their metrics.
* In v12AI this is a placeholder in the snippet I gave you — you’ll **reuse** your v11 logic here for averages and pass/fail coloring.
* Output is inserted before the summary block.

---

### **7. generateFinalHTMLReport(...)**

```js
function generateFinalHTMLReport(summaryData, configData, analysisData, summaryReport, siteCommonIssues) { ... }
```

* Combines all pieces into one HTML string:

  1. `<head>` with basic CSS.
  2. `<body>` with:

     * Title
     * Main scores table (`buildMainTable`)
     * **New summary block**:

       * Management Summary (from `summaryReport.management_summary`)
       * Site Common Issues (from `site_common_issues.json` or fallback)
       * “How to fix” shown inline if present.
  3. Saves to a timestamped filename like:

     ```
     lighthouse-metrics-report-2025-08-14T12-00-00.html
     ```

---

### **8. main()**

```js
(function main() { ... })();
```

* Entry point.
* Calls:

  * `getSummaryData()` → main table
  * `getConfigData()` → metadata
  * `getAnalysisData()` → analysis JSON
  * `getSummaryReport()` → mgmt summary bullets
  * `getSiteCommonIssues()` → site-wide issues
* Passes all into `generateFinalHTMLReport(...)`.

---

## **How It Uses Your New Files**

* **per\_url\_prioritized.json**
  Loaded first for analysis data.
  If missing, falls back to `lighthouse-analysis-data.json`.
* **site\_common\_issues.json**
  Primary source for the “Site Common Issues” list.
* **summary\_report.json**
  Source for management summary bullets and fallback top common issues.

---

## **Debug Tips**

1. **If HTML has empty summary** → Check `summary_report.json` & `site_common_issues.json` exist and have data.
2. **If “Analysis” modal is empty** → Ensure `per_url_prioritized.json` exists or fallback file is present.
3. **If scores table is wrong** → Look at `lhci-summary.json` format.
4. **To log data being read** → Temporarily add `console.log()` after each `getX()` function.
