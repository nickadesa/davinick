export type Asset = "XAUUSD" | "NASDAQ";
export type Bias = "bullish" | "bearish" | "neutral";
export type Action = "BUY" | "SELL" | "NEUTRAL";

export interface NewsEvent {
  id: string;
  time: string; // ISO UTC
  title: string;
  currency: string;
  actual: number | null;
  /** null for speeches / events without a numeric forecast */
  forecast: number | null;
  previous: number | null;
  unit: string;
  /** +1 if a higher-than-forecast print is good for that asset, -1 if bad */
  sensitivity: Record<Asset, 1 | -1>;
  /** how strongly the market typically reacts, 1-3 */
  weight: 1 | 2 | 3;
  note: string;
}

/** Parse calendar figures like "0.3%", "225K", "-1.2B", "<0.1%". */
export function parseFigure(raw: string | null | undefined): { value: number | null; unit: string } {
  if (!raw) return { value: null, unit: "" };
  const m = raw.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!m) return { value: null, unit: "" };
  const unit = raw.match(/[%KMBT]/i)?.[0]?.toUpperCase().replace("%", "%") ?? "";
  return { value: Number(m[0]), unit };
}

/** Typical USD-data reaction: stronger data → stronger USD & yields → pressure on gold and tech. */
export function classifyEvent(title: string): Pick<NewsEvent, "sensitivity" | "weight" | "note"> {
  const t = title.toLowerCase();
  const inverse = /unemployment rate|jobless|claims/.test(t);
  const weight: 1 | 2 | 3 = /cpi|non-farm|pce|federal funds|gdp|fomc/.test(t)
    ? 3
    : /retail|ppi|ism|jolts|employment cost|average hourly/.test(t)
      ? 2
      : 1;
  const s = inverse ? 1 : -1;
  const note = inverse
    ? "Higher reading = weaker labour market → softer USD and lower yields, usually supportive for gold and tech."
    : /cpi|pce|ppi|inflation|hourly/.test(t)
      ? "Hotter inflation lifts rate-hike odds → stronger USD and yields, pressure on gold and tech."
      : "Stronger-than-expected data tends to lift USD and yields, weighing on gold and Nasdaq.";
  return { sensitivity: { XAUUSD: s, NASDAQ: s }, weight, note };
}

/** Relative surprise: (actual - forecast) / |forecast|, clamped to ±1. */
export function surprise(e: NewsEvent): number {
  if (e.actual === null || e.forecast === null) return 0;
  const base = Math.abs(e.forecast) || 1;
  return Math.max(-1, Math.min(1, (e.actual - e.forecast) / base));
}

export function eventBias(e: NewsEvent, asset: Asset): Bias {
  const s = surprise(e) * e.sensitivity[asset];
  if (s > 0.02) return "bullish";
  if (s < -0.02) return "bearish";
  return "neutral";
}

export interface Signal {
  asset: Asset;
  action: Action;
  confidence: number; // 50-95
  score: number;
  drivers: number;
}

/** Combine released red-folder events into one signal with a confidence, never 100%. */
export function computeSignal(events: NewsEvent[], asset: Asset): Signal {
  const released = events.filter((e) => e.actual !== null && e.forecast !== null);
  const score = released.reduce((acc, e) => acc + surprise(e) * e.sensitivity[asset] * e.weight, 0);
  const confidence = Math.round(Math.min(95, 50 + Math.abs(score) * 28));
  const action: Action = Math.abs(score) < 0.05 ? "NEUTRAL" : score > 0 ? "BUY" : "SELL";
  return { asset, action, confidence: action === "NEUTRAL" ? 50 : confidence, score, drivers: released.length };
}

export type Outcome = "win" | "loss" | "pending" | "skip";

/** A BUY wins if price is higher after the horizon, a SELL wins if lower. NEUTRAL is not scored. */
export function outcome(action: Action, entry: number | null, later: number | null): Outcome {
  if (action === "NEUTRAL") return "skip";
  if (entry === null || later === null) return "pending";
  if (later === entry) return "loss";
  return (later > entry) === (action === "BUY") ? "win" : "loss";
}
