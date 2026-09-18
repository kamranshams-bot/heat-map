# USA Market Sector Heat Map

A single-page dashboard for eyeballing how the US stock market is moving —
by sector, and drilled down to individual large-cap stocks — so you can see
at a glance where money is rotating into or out of.

> **Not financial advice.** This is a visualization tool, not a source of
> truth. Weights are illustrative and the built-in "live" feed is a
> best-effort, delayed, free data source — always confirm anything here
> against a licensed provider before you trade.

## What it shows

- **Sector heat map** — all 11 S&P 500 GICS sectors as a treemap, sized by
  approximate index weight and colored by price change (green = up, red =
  down, intensity = magnitude).
- **Drill-down** — click a sector to see its major constituent stocks the
  same way; a breadcrumb takes you back up.
- **Table view** — the same data as a sortable table, for when you want
  exact numbers instead of tile sizes/colors.
- **Market movement tiles** — S&P 500 / Nasdaq-100 / Dow Jones proxies
  (via SPY / QQQ / DIA) with change % and a trend sparkline, plus a
  "sector breadth" tile (how many of the 11 sectors are up today).
- **Light/dark mode**, keyboard-navigable cells, and an always-visible
  color legend.

## Running it

No build step. Either:

```bash
open index.html          # macOS, or just double-click the file
```

or serve it locally (recommended — some browsers restrict `fetch()` from
`file://` pages, which the live-data button needs):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Data sources & limitations

- **Sample data** (`js/data.js`) is a hand-authored, dated snapshot bundled
  with the app so the dashboard always has something to show. It is
  clearly labeled as sample data in the UI (badge, tooltips, table).
- **Live data** (`js/live.js`) is opt-in via the **"Refresh live data"**
  button. It fetches free end-of-day quotes for the visible symbols
  directly from the browser (no server, no API key) from Stooq's public
  CSV endpoint. This is **best-effort**: it can fail depending on your
  network, CORS policy, or Stooq's own availability, in which case the
  dashboard falls back to sample data and shows an error badge — it never
  fails silently.
- Sector and stock **weights** are approximate figures set by hand for
  treemap sizing, not pulled from an index provider. Real S&P 500 weights
  change continuously.
- For production/reliable use, swap `js/live.js` for a paid real-time
  provider (e.g. Polygon.io, Finnhub, IEX Cloud, Alpha Vantage) — the rest
  of the app only needs a `{symbol, changePct}` map per refresh, so the
  UI code doesn't need to change.

## Project structure

```
index.html        Page shell / layout
css/style.css      Theming (light/dark) and layout
js/data.js         Sector & stock reference data + sample changes
js/live.js         Best-effort live quote fetcher (Stooq)
js/viz-utils.js    Dependency-free treemap layout + diverging color scale
js/app.js          Rendering, state, interactions
```

No external runtime dependencies — everything (including the treemap
layout algorithm and color interpolation) is vanilla JS, so the page works
offline and isn't dependent on a CDN being reachable.
