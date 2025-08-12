const path = require("path");
const pLimit = require("p-limit");

const { normalizeInputUrl } = require("./lib/utils/http");
const { log, setVerbose } = require("./lib/utils/logger");
const buildFilter = require("./lib/filter");
const group = require("./lib/group");
const createSampler = require("./lib/sample");
const validateFactory = require("./lib/validate");
const writer = require("./lib/writer");
const walkXmlSitemaps = require("./modes/xml-only");

module.exports = async function run(opts) {
  setVerbose(opts.verbose);

  const sitemapUrl = normalizeInputUrl(opts.url, opts.defaultSitemap);
  const origin = new URL(sitemapUrl).origin;

  log.info(`🌐 Origin: ${origin}`);
  log.info(`📄 Sitemap: ${sitemapUrl}`);
  log.info(
    `🎛️ Mode: ${opts.mode} perGroup=${opts.perGroup} target=${opts.targetTotal}`
  );
  if (opts.include?.length) log.info(`➕ include: ${opts.include.join(", ")}`);
  if (opts.exclude?.length) log.info(`➖ exclude: ${opts.exclude.join(", ")}`);
  if (opts.includeRe) log.info(`🔎 includeRe: ${opts.includeRe}`);
  if (opts.excludeRe) log.info(`🚫 excludeRe: ${opts.excludeRe}`);

  /* // debug and remove.
  
  const passes = buildFilter({
    origin,
    include: opts.include,
    exclude: opts.exclude,
    includeRe: opts.includeRe,
    excludeRe: opts.excludeRe,
  });
  */
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

  async function onUrl(url) {
    if (!passes(url)) return;
    if (sampler.isSatisfied()) return;
    const ok = await validateLimit(() => validate(url));
    if (!ok) return;
    sampler.add(url);
    log.debug("➕ picked:", url);
  }

  await walkXmlSitemaps({
    entry: sitemapUrl,
    origin,
    onUrl,
    concurrency: opts.concurrency,
    maxSitemaps: opts.maxSitemaps,
    shouldStop: () => sampler.isSatisfied(),
  });

  const urls = sampler.finalize();
  if (!urls.length) throw new Error("No URLs gathered.");

  // default output goes to repo root (assuming you run from repo root)
  const outPath = path.resolve(process.cwd(), opts.out);
  await writer.writeTestFile(outPath, urls);
  log.info(`📁 Written ${urls.length} URL(s) → ${outPath}`);
};
