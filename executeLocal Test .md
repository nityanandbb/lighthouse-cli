Quick examples (map to your six options)
Keep these sampler knobs unless you want different totals:
--mode=sample --targetTotal=50 --perGroup=5 (or --perGroup=10)

Got it. Here are **Quick Global Recipes** in the exact **sequence + requirements** you gave (Options 1 → 6). Copy-paste and tweak the bits in CAPS.

---

## Option 1 — Generate sample/random URL list

**Default total = 50. Per group = 5 or 10.**

### A) Balanced sample (recommended)

```bash
npm run sitemap:gather -- \
  --url https://WWW.YOUR-SITE.COM \
  --mode=sample --targetTotal=50 --perGroup=5 \
  --out ./TestURL.js
```

Change to **10 per group**:

```bash
--mode=sample --targetTotal=50 --perGroup=10
```

### B) Random list (shuffled)

```bash
npm run sitemap:gather -- \
  --url https://WWW.YOUR-SITE.COM \
  --mode=random --targetTotal=50 \
  --out ./TestURL.js
```

---

## Option 2 — Only include one sub-path (section or locale)

**Examples:** `/services/`, `/careers/`, `/en/`, `/en-US/`

```bash
npm run sitemap:gather -- \
  --url https://WWW.YOUR-SITE.COM \
  --mode=sample --targetTotal=50 --perGroup=5 \
  --startWith /services/ \
  --out ./TestURL.js
```

(Replace `/services/` with `/careers/` or `/en/` or `/en-US/` as needed.)

---

## Option 3 — StartWith **AND** Includes

**“Path starts with X AND also contains Y.”**
Example: under `/en/` and must mention `insights`.

```bash
npm run sitemap:gather -- \
  --url https://WWW.YOUR-SITE.COM \
  --mode=sample --targetTotal=50 --perGroup=5 \
  --startWith /en/ \
  --containsAny insights \
  --out ./TestURL.js
```

---

## Option 4 — Includes **AND** Includes (two strings required)

**“URL must contain A AND B.”**
Example: must contain `/en/` **and** `/insights/` (any order).

```bash
npm run sitemap:gather -- \
  --url https://WWW.YOUR-SITE.COM \
  --mode=sample --targetTotal=50 --perGroup=5 \
  --containsAll /en/ /insights/ \
  --out ./TestURL.js
```

---

## Option 5 — Includes **OR** (pick any of the list)

**“URL contains services OR careers OR products …”**

```bash
npm run sitemap:gather -- \
  --url https://WWW.YOUR-SITE.COM \
  --mode=sample --targetTotal=50 --perGroup=5 \
  --containsAny services careers products \
  --out ./TestURL.js
```

(Strict section prefixes version:)

```bash
--startWith /services/ /careers/ /products/
```

---

## Option 6 — Different domains if required (global)

Default = **same origin only**. Turn on subdomains or allow extra hosts.

### A) Include subdomains of the base site

```bash
npm run sitemap:gather -- \
  --url https://WWW.BRAND.COM \
  --mode=sample --targetTotal=50 --perGroup=5 \
  --allowSubdomains \
  --out ./TestURL.js
```

### B) Include specific extra hosts

```bash
--allowHosts api.BRAND.com media.BRAND.com
```

### C) Allow a whole TLD family via regex

```bash
--hostRe ".*\\.BRAND\\.(com|co\\.uk|de)$"
```

Full example:

```bash
npm run sitemap:gather -- \
  --url https://www.brand.com \
  --mode=sample --targetTotal=50 --perGroup=5 \
  --allowSubdomains \
  --hostRe ".*\\.brand\\.(com|co\\.uk|de)$" \
  --out ./TestURL.js
```

---

### Tiny tips (global)

* **Domain is decided by `--url`.** Filters act on the **path** (after the domain).
* To match both `/insights` and `/insights/`, use:

  * `--containsAny insights "/insights/"` **or**
  * `--includeRe "(^|/)insights(/|$)"`
* Quick test on big sites: add `--skipValidate --concurrency=16 --verbose`.

If you want, I can add npm shortcuts like:

```json
"scripts": {
  "sample:50x5": "node tools/sitemap/cli.js --mode=sample --targetTotal=50 --perGroup=5",
  "sample:en-insights": "node tools/sitemap/cli.js --mode=sample --targetTotal=50 --perGroup=5 --startWith /en/ --containsAny insights"
}
```

Then run:

```bash
npm run sample:en-insights -- --url https://WWW.YOUR-SITE.COM --out ./TestURL.js
```
