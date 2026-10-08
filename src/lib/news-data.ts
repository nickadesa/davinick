import type { NewsEvent } from "./signals";

// Sample red-folder events. Replace with a live economic-calendar feed.
const today = new Date();
const at = (h: number, m: number, dayOffset = 0) => {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + dayOffset, h, m));
  return d.toISOString();
};

export const newsEvents: NewsEvent[] = [
  {
    id: "cpi", time: at(12, 30), title: "US CPI m/m", currency: "USD", actual: 0.4, forecast: 0.3, previous: 0.2, unit: "%",
    sensitivity: { XAUUSD: -1, NASDAQ: -1 }, weight: 3,
    note: "Hotter inflation lifts rate-hike odds → stronger USD and yields, pressure on gold and tech.",
  },
  {
    id: "claims", time: at(12, 30), title: "Unemployment Claims", currency: "USD", actual: 241, forecast: 225, previous: 219, unit: "K",
    sensitivity: { XAUUSD: 1, NASDAQ: 1 }, weight: 1,
    note: "More claims signal a cooling labour market — softens the hawkish CPI read slightly.",
  },
  {
    id: "fomc", time: at(18, 0), title: "FOMC Meeting Minutes", currency: "USD", actual: null, forecast: 0, previous: 0, unit: "",
    sensitivity: { XAUUSD: -1, NASDAQ: -1 }, weight: 3,
    note: "Tone matters more than numbers. Hawkish wording would extend the current bias.",
  },
  {
    id: "nfp", time: at(12, 30, 1), title: "Non-Farm Payrolls", currency: "USD", actual: null, forecast: 180, previous: 142, unit: "K",
    sensitivity: { XAUUSD: -1, NASDAQ: -1 }, weight: 3,
    note: "Biggest risk event of the week. Expect wide spreads around release.",
  },
];
