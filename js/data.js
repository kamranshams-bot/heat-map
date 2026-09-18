/**
 * Illustrative dataset for the USA sector heat map.
 *
 * Weights (sector-of-index and stock-of-sector) are approximate, hand-set
 * figures meant to size the treemap realistically — they are NOT sourced
 * from a live index provider and will drift from the real thing over time.
 * `changePct` values are a hand-authored SAMPLE trading day, used whenever
 * a live fetch (js/live.js) isn't available or fails. Everything carries
 * `asOf` so the UI can always tell the viewer whether they're looking at
 * live or sample numbers.
 */

const DEMO_AS_OF = "2026-09-17 (sample close)";

const SECTORS = [
  {
    id: "technology",
    name: "Technology",
    etf: "XLK",
    weight: 31.2,
    changePct: 1.8,
    stocks: [
      { symbol: "AAPL", name: "Apple", weight: 22, changePct: 0.9 },
      { symbol: "MSFT", name: "Microsoft", weight: 20, changePct: 1.3 },
      { symbol: "NVDA", name: "NVIDIA", weight: 18, changePct: 4.2 },
      { symbol: "AVGO", name: "Broadcom", weight: 8, changePct: 2.6 },
      { symbol: "ORCL", name: "Oracle", weight: 5, changePct: -0.8 },
      { symbol: "CRM", name: "Salesforce", weight: 3, changePct: 0.4 },
      { symbol: "ADBE", name: "Adobe", weight: 2.5, changePct: -1.2 },
      { symbol: "CSCO", name: "Cisco", weight: 2.5, changePct: 0.6 },
    ],
  },
  {
    id: "financials",
    name: "Financials",
    etf: "XLF",
    weight: 13.1,
    changePct: 0.4,
    stocks: [
      { symbol: "BRK.B", name: "Berkshire Hathaway", weight: 12, changePct: 0.2 },
      { symbol: "JPM", name: "JPMorgan Chase", weight: 11, changePct: 0.9 },
      { symbol: "V", name: "Visa", weight: 8, changePct: 0.6 },
      { symbol: "MA", name: "Mastercard", weight: 7, changePct: 0.5 },
      { symbol: "BAC", name: "Bank of America", weight: 5, changePct: -0.3 },
      { symbol: "WFC", name: "Wells Fargo", weight: 4, changePct: -0.6 },
      { symbol: "GS", name: "Goldman Sachs", weight: 3, changePct: 1.1 },
    ],
  },
  {
    id: "health-care",
    name: "Health Care",
    etf: "XLV",
    weight: 10.4,
    changePct: -0.6,
    stocks: [
      { symbol: "LLY", name: "Eli Lilly", weight: 12, changePct: -0.9 },
      { symbol: "UNH", name: "UnitedHealth", weight: 9, changePct: -2.1 },
      { symbol: "JNJ", name: "Johnson & Johnson", weight: 7, changePct: 0.3 },
      { symbol: "ABBV", name: "AbbVie", weight: 6, changePct: -0.4 },
      { symbol: "MRK", name: "Merck", weight: 5, changePct: -1.5 },
      { symbol: "PFE", name: "Pfizer", weight: 3, changePct: 0.2 },
      { symbol: "TMO", name: "Thermo Fisher", weight: 3, changePct: -0.7 },
    ],
  },
  {
    id: "consumer-discretionary",
    name: "Consumer Discretionary",
    etf: "XLY",
    weight: 10.8,
    changePct: 2.3,
    stocks: [
      { symbol: "AMZN", name: "Amazon", weight: 40, changePct: 2.9 },
      { symbol: "TSLA", name: "Tesla", weight: 18, changePct: 4.5 },
      { symbol: "HD", name: "Home Depot", weight: 10, changePct: 0.4 },
      { symbol: "MCD", name: "McDonald's", weight: 5, changePct: -0.2 },
      { symbol: "NKE", name: "Nike", weight: 3, changePct: 1.0 },
      { symbol: "LOW", name: "Lowe's", weight: 3, changePct: 0.3 },
    ],
  },
  {
    id: "communication-services",
    name: "Communication Services",
    etf: "XLC",
    weight: 9.3,
    changePct: 1.1,
    stocks: [
      { symbol: "GOOGL", name: "Alphabet", weight: 32, changePct: 1.4 },
      { symbol: "META", name: "Meta Platforms", weight: 22, changePct: 1.9 },
      { symbol: "NFLX", name: "Netflix", weight: 8, changePct: -0.5 },
      { symbol: "DIS", name: "Disney", weight: 6, changePct: 0.2 },
      { symbol: "CMCSA", name: "Comcast", weight: 5, changePct: -1.0 },
      { symbol: "T", name: "AT&T", weight: 3, changePct: 0.1 },
    ],
  },
  {
    id: "industrials",
    name: "Industrials",
    etf: "XLI",
    weight: 8.4,
    changePct: 0.2,
    stocks: [
      { symbol: "GE", name: "GE Aerospace", weight: 6, changePct: 1.2 },
      { symbol: "CAT", name: "Caterpillar", weight: 5, changePct: -0.4 },
      { symbol: "RTX", name: "RTX Corp", weight: 4, changePct: 0.5 },
      { symbol: "HON", name: "Honeywell", weight: 4, changePct: -0.3 },
      { symbol: "UNP", name: "Union Pacific", weight: 4, changePct: 0.1 },
      { symbol: "BA", name: "Boeing", weight: 3, changePct: -1.8 },
      { symbol: "UPS", name: "UPS", weight: 3, changePct: 0.7 },
    ],
  },
  {
    id: "consumer-staples",
    name: "Consumer Staples",
    etf: "XLP",
    weight: 5.9,
    changePct: -0.3,
    stocks: [
      { symbol: "WMT", name: "Walmart", weight: 14, changePct: 0.5 },
      { symbol: "PG", name: "Procter & Gamble", weight: 13, changePct: -0.2 },
      { symbol: "COST", name: "Costco", weight: 12, changePct: -0.9 },
      { symbol: "KO", name: "Coca-Cola", weight: 9, changePct: -0.1 },
      { symbol: "PEP", name: "PepsiCo", weight: 8, changePct: -1.1 },
      { symbol: "PM", name: "Philip Morris", weight: 5, changePct: 0.6 },
    ],
  },
  {
    id: "energy",
    name: "Energy",
    etf: "XLE",
    weight: 3.4,
    changePct: -1.9,
    stocks: [
      { symbol: "XOM", name: "Exxon Mobil", weight: 23, changePct: -1.8 },
      { symbol: "CVX", name: "Chevron", weight: 16, changePct: -1.4 },
      { symbol: "COP", name: "ConocoPhillips", weight: 8, changePct: -2.6 },
      { symbol: "SLB", name: "Schlumberger", weight: 4, changePct: -3.1 },
    ],
  },
  {
    id: "utilities",
    name: "Utilities",
    etf: "XLU",
    weight: 2.5,
    changePct: 0.5,
    stocks: [
      { symbol: "NEE", name: "NextEra Energy", weight: 13, changePct: 0.8 },
      { symbol: "SO", name: "Southern Co", weight: 7, changePct: 0.3 },
      { symbol: "DUK", name: "Duke Energy", weight: 7, changePct: 0.4 },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    etf: "XLRE",
    weight: 2.1,
    changePct: -0.8,
    stocks: [
      { symbol: "PLD", name: "Prologis", weight: 11, changePct: -1.1 },
      { symbol: "AMT", name: "American Tower", weight: 9, changePct: -0.5 },
      { symbol: "EQIX", name: "Equinix", weight: 7, changePct: -0.3 },
    ],
  },
  {
    id: "materials",
    name: "Materials",
    etf: "XLB",
    weight: 1.9,
    changePct: -0.4,
    stocks: [
      { symbol: "LIN", name: "Linde", weight: 20, changePct: -0.2 },
      { symbol: "SHW", name: "Sherwin-Williams", weight: 8, changePct: -0.6 },
      { symbol: "ECL", name: "Ecolab", weight: 6, changePct: -0.9 },
    ],
  },
];

// Broad-market proxies shown as stat tiles. Real indices (S&P 500, Nasdaq
// Composite, Dow Jones) aren't freely tradeable tickers, so these ETFs are
// used as widely-quoted stand-ins and labeled as such in the UI.
const INDEXES = [
  {
    symbol: "SPY",
    name: "S&P 500 (SPY)",
    changePct: 1.0,
    price: 589.42,
    sparkline: [-0.4, -0.2, 0.1, 0.3, 0.2, 0.5, 0.7, 0.6, 0.8, 0.9, 0.95, 1.0],
  },
  {
    symbol: "QQQ",
    name: "Nasdaq-100 (QQQ)",
    changePct: 1.6,
    price: 502.87,
    sparkline: [-0.6, -0.3, 0.0, 0.4, 0.3, 0.6, 1.0, 0.9, 1.2, 1.3, 1.5, 1.6],
  },
  {
    symbol: "DIA",
    name: "Dow Jones (DIA)",
    changePct: 0.3,
    price: 428.11,
    sparkline: [0.1, 0.0, -0.1, 0.05, 0.1, 0.15, 0.2, 0.15, 0.25, 0.28, 0.3, 0.3],
  },
];
