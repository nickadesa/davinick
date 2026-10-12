/** Maps red-folder calendar titles to official FRED series and turns raw observations into the calendar's figure. Pure — no network. */
export type FredTransform = "level" | "mom" | "yoy" | "diff" | "thousandsToK" | "thousandsToM" | "personsToK";

export interface FredRule { match: RegExp; series: string; transform: FredTransform }

export const FRED_RULES: FredRule[] = [
  { match: /^core cpi m\/m/i, series: "CPILFESL", transform: "mom" },
  { match: /^core cpi y\/y/i, series: "CPILFESL", transform: "yoy" },
  { match: /^cpi m\/m/i, series: "CPIAUCSL", transform: "mom" },
  { match: /^cpi y\/y/i, series: "CPIAUCSL", transform: "yoy" },
  { match: /^core pce price index m\/m/i, series: "PCEPILFE", transform: "mom" },
  { match: /^core pce price index y\/y/i, series: "PCEPILFE", transform: "yoy" },
  { match: /^ppi m\/m/i, series: "PPIFIS", transform: "mom" },
  { match: /^core retail sales m\/m/i, series: "RSFSXMV", transform: "mom" },
  { match: /^retail sales m\/m/i, series: "RSAFS", transform: "mom" },
  { match: /non-farm employment change/i, series: "PAYEMS", transform: "diff" },
  { match: /^unemployment rate/i, series: "UNRATE", transform: "level" },
  { match: /^unemployment claims/i, series: "ICSA", transform: "personsToK" },
  { match: /^average hourly earnings m\/m/i, series: "CES0500000003", transform: "mom" },
  { match: /gdp q\/q/i, series: "A191RL1Q225SBEA", transform: "level" },
  { match: /jolts job openings/i, series: "JTSJOL", transform: "thousandsToM" },
];

export function fredRuleFor(title: string): FredRule | null {
  return FRED_RULES.find((r) => r.match.test(title.trim())) ?? null;
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** values: newest first. Returns the figure in calendar units, or null if not enough data. */
export function applyTransform(t: FredTransform, values: number[]): number | null {
  const [a, b] = values;
  if (a == null || Number.isNaN(a)) return null;
  switch (t) {
    case "level": return round(a, 1);
    case "personsToK": return Math.round(a / 1000);
    case "thousandsToK": return Math.round(a);
    case "thousandsToM": return round(a / 1000, 2);
    case "diff": return b == null ? null : Math.round(a - b);
    case "mom": return b == null || !b ? null : round(((a - b) / b) * 100, 1);
    case "yoy": { const y = values[12]; return y == null || !y ? null : round(((a - y) / y) * 100, 1); }
  }
}

/** The release counts only if FRED published the latest value on/after the event's New York date. */
export function isFreshRelease(vintageDate: string, eventIso: string): boolean {
  const eventNy = new Date(eventIso).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return vintageDate >= eventNy;
}
