 **fill the GitHub Actions form** (the “Run workflow” pop-up) with correct inputs.

# How to run it (UI)

1. Go to **Actions → ⛳️ 🗺️ 🚀 Sitemap AI + Lighthouse Audit CLI**.
2. Click **Run workflow** (top right).
3. Fill the fields as shown in the examples below.
4. Press **Run workflow**.

> Rule: **Base URL is required** (except CSS mode “4: Raw list”).
> Rule: Leave any field you don’t need **blank**. Don’t add quotes unless the value has spaces.

---

# Quick Field Cheatsheet

* **runType**: `sitemap` or `css`
* **baseUrl**: e.g. `https://www.brand.com` (required unless cssMode=4)
* **sitemapMode** (1–6) + optional filters (startWith / containsAny / containsAll / exclude / includeRe / excludeRe)
* **sitemapPreset**: `50x5`, `200x10`, or `custom` (if custom, set **targetTotal** + **perGroup**)
* **cssMode** (1–5), **selector** (for 2/3), **cssPreset** (optional helper), or **rawInput** (for 4)

---

# Sitemap examples (fill the form like this)

### 1) Balanced sample (default)

* **runType**: `sitemap`
* **baseUrl**: `https://www.brand.com`
* **sitemapMode**: `1`
* **sitemapPreset**: `50x5` (or `200x10`)
* *(leave all filters empty)*

### 2) Only a specific section (e.g., /services/)

* **runType**: `sitemap`
* **baseUrl**: `https://www.brand.com`
* **sitemapMode**: `2`
* **startWith**: `/services/`
* **sitemapPreset**: `50x5`

*(Multiple sections?)* put: `/services/ /products/`

### 3) StartWith **AND** Contains (e.g., English Insights)

* **runType**: `sitemap`
* **baseUrl**: `https://www.brand.com`
* **sitemapMode**: `3`
* **startWith**: `/en/`
* **containsAny**: `insights`
* **sitemapPreset**: `200x10`

### 4) Contains **AND** Contains (must include both)

* **runType**: `sitemap`
* **baseUrl**: `https://www.brand.com`
* **sitemapMode**: `4`
* **containsAll**: `/en/ /insights/`
* **sitemapPreset**: `200x10`

### 5) Contains **OR** (any of these)

* **runType**: `sitemap`
* **baseUrl**: `https://www.brand.com`
* **sitemapMode**: `5`
* **containsAny**: `careers services products`
* **sitemapPreset**: `50x5`

### 6) Multi-domain / Global (subdomains or multi-TLDs)

* **runType**: `sitemap`
* **baseUrl**: `https://www.brand.com`
* **sitemapMode**: `6`
* **allowSubdomains**: `true`
  *(optional)* **hostRe**: `.*\.brand\.(com|co\.uk|de)$`
* **sitemapPreset**: `200x10`

> Pro tip: filters work on the **path** after the domain. The domain comes from **baseUrl**.

---

# CSS / XPath runner examples

### A) All anchors (auto)

* **runType**: `css`
* **baseUrl**: `https://www.brand.com`
* **cssMode**: `5` *(or `1: Auto(anchors)`)*
* *(no selector needed)*

### B) CSS selector (e.g., top nav links)

* **runType**: `css`
* **baseUrl**: `https://www.brand.com`
* **cssMode**: `2`
* **selector**: `.nav a`
  *(or leave selector blank and set **cssPreset** = “Nav links (.nav a)”)*
* **cssPreset**: `Nav links (.nav a)` *(optional helper)*

Other handy selectors to try:

* `footer a`
* `.article a`
* `a.button`
* `a[href]`

### C) XPath selector (e.g., all anchors with href)

* **runType**: `css`
* **baseUrl**: `https://www.brand.com`
* **cssMode**: `3`
* **selector**: `//a[@href]`

### D) Raw URL list (no baseUrl needed)

* **runType**: `css`
* **cssMode**: `4`
* **rawInput**:

  ```
  https://www.brand.com/
  https://www.brand.com/services/
  https://www.brand.com/careers/
  ```

  *(space or newline separated is fine)*

---

# Mini cookbook (common patterns)

* **Locale exact + section exact** (avoid partial matches):

  * **includeRe**: `(^|/)insights(/|$)`
  * (Pairs well with **startWith** `/en/`)

* **Careers anywhere** (any locale):

  * **containsAny**: `careers jobs "join-us"`
  * (Optional **startWith** locales: `/en/ /fr/ /de/`)

* **Bigger sites** (faster sampling):

  * **concurrency**: `16`
  * **skipValidate**: `true` (optional; skips HTTP 200 check)

* **Coverage vs Depth**:

  * Broad coverage → smaller **perGroup** (e.g., 5–10)
  * Deeper in a section → larger **perGroup** (e.g., 50–200)

---

# Tiny gotchas

* Don’t wrap values in quotes in the form (except when a **single value contains a space**, like `"join-us"` in **containsAny**—you can also just type `join-us` without quotes).
* You can separate multiple values in a field with **spaces** or **new lines** (both are supported).
* **baseUrl** is required for everything except **cssMode=4 (Raw)**.

---
