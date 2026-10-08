export type Asset = "XAUUSD" | "NASDAQ";
export type Bias = "bullish" | "bearish" | "neutral";
export type Action = "BUY" | "SELL" | "NEUTRAL";

export interface NewsEvent {
  id: string;
  time: string; // ISO UTC
  title: string;
  currency: string;
  actual: number | null;
  forecast: number;
  previous: number;
  unit: string;
  /** +1 if a higher-than-forecast print is good for that asset, -1 if bad */
  sensitivity: Record<Asset, 1 | -1>;
  /** how strongly the market typically reacts, 1-3 */
  weight: 1 | 2 | 3;
  note: string;
}

/** Relative surprise: (actual - forecast) / |forecast|, clamped to ±1. */
export function surprise(e: NewsEvent): number {
  if (e.actual === null) return 0;
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
  const released = events.filter((e) => e.actual !== null);
  const score = released.reduce((acc, e) => acc + surprise(e) * e.sensitivity[asset] * e.weight, 0);
  const confidence = Math.round(Math.min(95, 50 + Math.abs(score) * 60));
  const action: Action = Math.abs(score) < 0.05 ? "NEUTRAL" : score > 0 ? "BUY" : "SELL";
  return { asset, action, confidence: action === "NEUTRAL" ? 50 : confidence, score, drivers: released.length };
}
