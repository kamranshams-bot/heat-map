/**
 * Best-effort live-data layer.
 *
 * Tries to pull real end-of-day quotes from Stooq's free CSV endpoint,
 * directly from the viewer's browser (no server, no API key). This is
 * NOT guaranteed to work: Stooq may not send CORS headers to every
 * origin, may rate-limit, or may be unreachable from a given network —
 * in any of those cases fetchLiveChanges() rejects and the caller falls
 * back to the bundled sample data in js/data.js. See README.md for how
 * to swap in a paid data provider for a reliable feed.
 */

const STOOQ_DAILY_URL = (symbol) =>
  `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&i=d`;

function toStooqSymbol(symbol) {
  // Stooq uses '-' rather than '.' for share classes, e.g. BRK.B -> BRK-B
  return symbol.replace(".", "-");
}

async function fetchOneChange(symbol) {
  const res = await fetch(STOOQ_DAILY_URL(toStooqSymbol(symbol)), {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`);
  const text = await res.text();
  const rows = text.trim().split("\n");
  if (rows.length < 3 || !rows[0].startsWith("Date")) {
    throw new Error(`Unexpected response for ${symbol}`);
  }
  const last = rows[rows.length - 1].split(",");
  const prev = rows[rows.length - 2].split(",");
  const lastClose = parseFloat(last[4]);
  const prevClose = parseFloat(prev[4]);
  if (!isFinite(lastClose) || !isFinite(prevClose) || prevClose === 0) {
    throw new Error(`Unparseable quote for ${symbol}`);
  }
  return {
    symbol,
    price: lastClose,
    changePct: ((lastClose - prevClose) / prevClose) * 100,
    date: last[0],
  };
}

/**
 * Fetch live changes for a list of ticker symbols.
 * Returns a Map<symbol, {price, changePct, date}> containing only the
 * symbols that succeeded — callers should keep sample data for any
 * symbol missing from the result.
 * Throws only if every single symbol failed (treated as "live is down").
 */
async function fetchLiveChanges(symbols) {
  const settled = await Promise.allSettled(symbols.map(fetchOneChange));
  const out = new Map();
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      out.set(symbols[i], result.value);
    }
  });
  if (out.size === 0) {
    throw new Error("Live data unavailable (network or CORS blocked every symbol)");
  }
  return out;
}
