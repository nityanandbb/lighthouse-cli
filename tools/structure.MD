Root-existing-repo/
├─ tools/
│  └─ sitemap/
│     ├─ cli.js
│     ├─ index.js
│     ├─ modes/xml-only.js
│     └─ lib/…  (the small modules)
├─ runLighthouseAuto.js   (unchanged)
└─ package.json           (add a script only) 

// need to install 
1) npm i fast-xml-parser@^4.5.0 p-limit@^5.0.0 yargs@^17.7.2


2) If you prefer other package managers:

# Yarn
yarn add fast-xml-parser@^4.5.0 p-limit@^5.0.0 yargs@^17.7.2

# pnpm
pnpm add fast-xml-parser@^4.5.0 p-limit@^5.0.0 yargs@^17.7.



HOW TO RUN EX : 

# from repo root
npm i
npm run sitemap:gather -- \
  --url https://www.qed42.com/sitemap.xml \
  --mode=sample50 \
  --skipValidate \
  --verbose \
  --out ./TestURL.js



---ex>
got it — here’s a super simple, non-technical runbook your team can follow. no jargon, just fill-in-the-blanks.

---

# Make a URL list from a sitemap (pick your own sections)

### What this tool does

You give it a website. It reads the site’s sitemap and makes a list of up to **50 URLs**, spread across different sections of the site.

* **Balanced sample:** `--perGroup=5` means “take at most 5 URLs from each section.”
* A **section (group)** is usually the first folder in the path, like:

  * `https://site.com/**products**/x` → section = `/products/`
  * `https://site.com/**careers**/apply` → section = `/careers/`
  * `https://site.com/**en**/services/a` → section = `/en/`

### The standard knobs (always use these unless told otherwise)

```
--mode=sample50 --targetTotal=50 --perGroup=5
```

\= “Give me up to 50 URLs, and don’t take more than 5 from any one section.”

---

## How to run (template)

1. Pick the website:

```
--url https://YOUR-SITE.com
```

(You can also pass the full sitemap, e.g. `https://YOUR-SITE.com/sitemap.xml`.)

2. Choose what you want:

* **Start with** (strict section): `--startWith /services/ /products/`
* **Contains** (word anywhere in path): `--containsAny sku_ id`
* You can combine them.

3. Run it (copy & edit):

```bash
npm run sitemap:gather -- \
  --url https://YOUR-SITE.com \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  [--startWith /your-section/ /another-section/] \
  [--containsAny word1 word2] \
  --out ./TestURL.js
```

> Note: In the filters, you use **paths** (the part after the domain), not the domain itself.

---

## Clear, real-world examples

### A) “Services pages” (strictly under `/services/`)

```bash
npm run sitemap:gather -- \
  --url https://test.abc.com \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  --startWith /services/ \
  --out ./TestURL.js
```

### B) “Anything that mentions products” (anywhere in path)

```bash
npm run sitemap:gather -- \
  --url https://test.abc.com \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  --containsAny products \
  --out ./TestURL.js
```

### C) “Products section + looks like a SKU or ID”

```bash
npm run sitemap:gather -- \
  --url https://test.abc.com \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  --startWith /products/ \
  --containsAny sku_ id \
  --out ./TestURL.js
```

### D) “English pages about solutions”

```bash
npm run sitemap:gather -- \
  --url https://www.unw.in \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  --startWith /en/ \
  --containsAny solutions \
  --out ./TestURL.js
```

### E) “Any path that has an ID in it (path or query)”

```bash
npm run sitemap:gather -- \
  --url https://test.abc.com \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  --containsAny /id/ id= \
  --matchQuery \
  --out ./TestURL.js
```

### F) “Multiple sections in one go” (you control the grouping)

```bash
npm run sitemap:gather -- \
  --url https://test.abc.com \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  --startWith /about/ /solutions/ /case-studies/ \
  --out ./TestURL.js
```

### G) “Exclude blog & news”

```bash
npm run sitemap:gather -- \
  --url https://test.abc.com \
  --mode=sample50 --targetTotal=50 --perGroup=5 \
  --exclude /blog/ /news/ \
  --out ./TestURL.js
```

---

## Cheat sheet (what to change)

* Want **different sections**? Change `--startWith` values (e.g., `/events/`, `/contact/`, `/pricing/`).
* Want **keyword matching** anywhere in the path? Use `--containsAny word1 word2`.
* Want **both**? Use both flags; both conditions must pass.
* Too many from one section? Lower `--perGroup` (e.g., `--perGroup=3`).
* Need more total links? Raise `--targetTotal` (e.g., `--targetTotal=80`).

---

## After it runs

* You’ll get `TestURL.js`:

  ```js
  exports.urls = [ "https://test.abc.com/...", ... ];
  ```
* Then run your Lighthouse file:

  ```bash
  node runLighthouseAuto.js
  ```

> Tip for quick testing: add `--skipValidate --verbose` to see fast results.
> Windows users: wrap paths/words in **double quotes**, e.g. `--startWith "/services/"`.



commands :-

Here are one-to-one command swaps with the new knobs:

### 1) Basic (no filters)

**Before**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=50 --perGroup=5 --out ./TestURL.js
```

**After (200 total / 10 per group)**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=200 --perGroup=10 --out ./TestURL.js
```

### 2) “Services” section only

**Before**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=50 --perGroup=5 --startWith /services/ --out ./TestURL.js
```

**After**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=200 --perGroup=10 --startWith /services/ --out ./TestURL.js
```

### 3) Products with SKU or ID

**Before**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=50 --perGroup=5 --startWith /products/ --containsAny sku_ id --out ./TestURL.js
```

**After**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=200 --perGroup=10 --startWith /products/ --containsAny sku_ id --out ./TestURL.js
```

### 4) Exclude blog/news

**Before**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=50 --perGroup=5 --exclude /blog/ /news/ --out ./TestURL.js
```

**After**

```bash
npm run sitemap:gather -- --url https://test.abc.com --mode=sample50 --targetTotal=200 --perGroup=10 --exclude /blog/ /news/ --out ./TestURL.js
```

### 5) English + solutions

**Before**

```bash
npm run sitemap:gather -- --url https://www.unw.in --mode=sample50 --targetTotal=50 --perGroup=5 --startWith /en/ --containsAny solutions --out ./TestURL.js
```

**After**

```bash
npm run sitemap:gather -- --url https://www.unw.in --mode=sample50 --targetTotal=200 --perGroup=10 --startWith /en/ --containsAny solutions --out ./TestURL.js
```




# How to use the shortcuts:

bash
Copy
Edit
# 50 total / 5 per group
npm run sample:50x5 -- --url https://test.abc.com --out ./TestURL.js

# 200 total / 10 per group
npm run sample:200x10 -- --url https://test.abc.com --out ./TestURL.js

# You can add filters too:
npm run sample:200x10 -- \
  --url https://test.abc.com \
  --startWith /products/ \
  --containsAny sku_ id \
  --out ./TestURL.js
One-liner you asked for (new knobs)
If you don’t want the npm script and just want the raw command:

bash
Copy
Edit
npm run sitemap:gather -- \
  --url https://test.abc.com \
  --mode=sample \
  --targetTotal=200 \
  --perGroup=10 \
  --out ./TestURL.js
That’s it—now the team can say “sample 200 URLs, max 10 per section” using either the shortcut or the --mode=sample alias.



npm run sitemap:gather -- \
  --url https://www.qed42.com/sitemap.xml \
  --mode=sample \
  --targetTotal=500 \
  --perGroup=500 \
  --out ./TestURL.js

npm run sitemap:gather -- \
  --url https://www.qed42.com/sitemap.xml \
  --mode=sample --targetTotal=500 --perGroup=100 \
  --concurrency=16 --skipValidate \
  --out ./TestURL1.js >> cloud need :  ./TestURL.js


  Option A — strictly under the /insights/ section
(only paths that start with /insights/)


npm run sitemap:gather -- \
  --url https://www.qed42.com/sitemap.xml \
  --mode=sample --targetTotal=500 --perGroup=100 \
  --startWith /insights/ \
  --out ./TestURL1.js

  
  npm run sitemap:gather -- \
  --url https://www.qed42.com/sitemap.xml \
  --mode=sample --targetTotal=500 --perGroup=100 \
  --containsAny insights \
  --out ./TestURL1.js
