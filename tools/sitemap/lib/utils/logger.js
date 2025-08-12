// Minimal color + emoji logger (no extra deps)
let VERBOSE = false;

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function setVerbose(v) {
  VERBOSE = !!v;
}

const log = {
  info: (...a) => console.log(...a),
  warn: (...a) => console.warn(c.yellow, "⚠️", ...a, c.reset),
  error: (...a) => console.error(c.red, "❌", ...a, c.reset),
  debug: (...a) => {
    if (VERBOSE) console.log(c.gray, "…", ...a, c.reset);
  },
};

// 00:01:23
function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600)
    .toString()
    .padStart(2, "0");
  const mm = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * startTicker(getSnapshot, intervalMs)
 * - Calls getSnapshot() every intervalMs, prints a friendly progress line.
 * - Returns stop() to clear the interval.
 */
function startTicker(getSnapshot, intervalMs = 3000) {
  const t0 = Date.now();
  const timer = setInterval(() => {
    const snap = getSnapshot?.() || {};
    const elapsed = formatDuration(Date.now() - t0);

    const line =
      `${c.cyan}⏳ [${elapsed}]${c.reset} ` +
      `${c.blue}Sitemaps:${c.reset} ${snap.sitemapsProcessed ?? 0} ` +
      `${c.dim}(queue ${snap.sitemapsQueued ?? 0})${c.reset} ` +
      `| ${c.magenta}URLs seen:${c.reset} ${snap.urlsDiscovered ?? 0} ` +
      `| ${c.green}Valid OK:${c.reset} ${snap.urlsValidatedOk ?? 0} ` +
      `| ${c.yellow}Kept:${c.reset} ${snap.kept ?? 0}/${
        snap.targetTotal ?? "?"
      } ` +
      `| ${c.cyan}Groups:${c.reset} ${snap.groups ?? 0}`;

    console.log(line);
  }, intervalMs);

  return function stop() {
    clearInterval(timer);
  };
}

module.exports = { log, setVerbose, c, startTicker, formatDuration };
