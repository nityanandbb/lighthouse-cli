const path = require("path");
// If you hit ERR_REQUIRE_ESM, pin: npm i p-limit@2.3.0
const pLimit = require("p-limit");

const { normalizeInputUrl } = require("./lib/utils/http");
const {
  log,
  setVerbose,
  c,
  startTicker,
  formatDuration,
} = require("./lib/utils/logger");
const buildFilter = require("./lib/filter");
const group = require("./lib/group");
const createSampler = require("./lib/sample");
const validateFactory = require("./lib/validate");
const writer = require("./lib/writer");
const walkXmlSitemaps = require("./modes/xml-only");

module.exports = async function run(opts) {
  setVerbose(opts.verbose);

  const t0 = Date.now();
  const sitemapUrl = normalizeInputUrl(opts.url, opts.defaultSitemap);
  const origin = new URL(sitemapUrl).origin;

  const modeLabel =
    opts.mode === "sample"
      ? `sample (perGroup=${opts.perGroup} target=${opts.targetTotal})`
      : `${opts.mode} perGroup=${opts.perGroup} target=${opts.targetTotal}`;

  // Header (color + emoji)
  log.info(`${c.cyan}🌐 Origin:${c.reset} ${origin}`);
  log.info(`${c.blue}📄 Sitemap:${c.reset} ${sitemapUrl}`);
  log.info(`${c.magenta}🎛️ Mode:${c.reset} ${modeLabel}`);

  if (opts.include?.length) log.info(`➕ include: ${opts.include.join(", ")}`);
  if (opts.exclude?.length) log.info(`➖ exclude: ${opts.exclude.join(", ")}`);
  if (opts.includeRe) log.info(`🔎 includeRe: ${opts.includeRe}`);
  if (opts.excludeRe) log.info(`🚫 excludeRe: ${opts.excludeRe}`);
  if (opts.startWith?.length)
    log.info(`↘️ startWith: ${opts.startWith.join(", ")}`);
  if (opts.containsAny?.length)
    log.info(`🔎 containsAny: ${opts.containsAny.join(", ")}`);
  if (opts.containsAll?.length)
    log.info(`✅ containsAll: ${opts.containsAll.join(", ")}`);
  if (opts.matchQuery) log.info(`❓ matchQuery: true`);

  const passes = buildFilter({
    origin,
    include: opts.include,
    exclude: opts.exclude,
    includeRe: opts.includeRe,
    excludeRe: opts.excludeRe,
    startWith: opts.startWith,
    containsAny: opts.containsAny,
    containsAll: opts.containsAll,
    matchQuery: opts.matchQuery,
  });

  const sampler = createSampler({
    mode: opts.mode,
    perGroup: opts.perGroup,
    targetTotal: opts.targetTotal,
    groupKey: (url) => group.key(url),
  });

  const validate = validateFactory({
    skip: opts.skipValidate,
    timeoutMs: 10000,
  });
  const validateLimit = pLimit(opts.concurrency);

  // Progress state for ticker
  const groupsSet = new Set();
  const progress = {
    sitemapsProcessed: 0,
    sitemapsQueued: 0,
    urlsDiscovered: 0,
    urlsValidatedOk: 0,
    kept: 0,
    groups: 0,
  };

  async function onUrl(url) {
    // Count every candidate we consider from a urlset
    progress.urlsDiscovered++;

    // Filters on path/domain (fast fail)
    if (!passes(url)) return;

    // Stop early if we're satisfied
    if (sampler.isSatisfied()) return;

    // Validate 200 (unless skipped)
    const ok = await validateLimit(() => validate(url));
    if (ok) progress.urlsValidatedOk++;
    if (!ok) return;

    // Try to add under sampling rules
    const added = sampler.add(url);
    if (added) {
      progress.kept++;
      groupsSet.add(group.key(url));
      progress.groups = groupsSet.size;
    }

    log.debug("➕ picked:", url);
  }

  function onSitemap(meta) {
    progress.sitemapsProcessed++;
    if (typeof meta?.queueSize === "number")
      progress.sitemapsQueued = meta.queueSize;
    // You could also log each file in verbose mode:
    log.debug(
      `🧭 sitemap: ${meta.kind} → ${meta.url} ` +
        (meta.kind === "sitemapindex"
          ? `(children: ${meta.childCount ?? 0})`
          : meta.kind === "urlset"
          ? `(urls: ${meta.urlCount ?? 0})`
          : "")
    );
  }

  // Start periodic ticker (every 3s)
  const stopTicker = startTicker(
    () => ({
      sitemapsProcessed: progress.sitemapsProcessed,
      sitemapsQueued: progress.sitemapsQueued,
      urlsDiscovered: progress.urlsDiscovered,
      urlsValidatedOk: progress.urlsValidatedOk,
      kept: progress.kept,
      groups: progress.groups,
      targetTotal: opts.targetTotal,
    }),
    3000
  );

  // Walk sitemaps and collect URLs
  await walkXmlSitemaps({
    entry: sitemapUrl,
    origin,
    onUrl,
    onSitemap, // NEW
    concurrency: opts.concurrency,
    maxSitemaps: opts.maxSitemaps,
    shouldStop: () => sampler.isSatisfied(),
  }).catch((e) => {
    stopTicker();
    throw e;
  });

  // Stop ticker and print final summary
  stopTicker();

  const urls = sampler.finalize();
  if (!urls.length) throw new Error("No URLs gathered.");

  const outPath = path.resolve(process.cwd(), opts.out);
  await writer.writeTestFile(outPath, urls);

  const elapsed = formatDuration(Date.now() - t0);
  log.info(
    `${c.green}✅ Done${c.reset} ${c.dim}(${elapsed})${c.reset} ` +
      `| Sitemaps: ${progress.sitemapsProcessed} ` +
      `| Seen: ${progress.urlsDiscovered} ` +
      `| Valid: ${progress.urlsValidatedOk} ` +
      `| Kept: ${progress.kept} in ${progress.groups} groups`
  );
  log.info(`📁 Written ${urls.length} URL(s) → ${outPath}`);
};
