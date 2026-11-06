// Basic CSV import helpers for Tradovate / MT4/MT5 style files
export type ImportRow = {
  date: string;
  instrument: string;
  side: "BUY" | "SELL";
  size: number;
  entry: number;
  exit: number;
  pnl: number;
  notes: string;
};

export function parseSimpleCsv(text: string): ImportRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const get = (keys: string[]) => {
      for (const k of keys) {
        const idx = headers.indexOf(k);
        if (idx >= 0) return cols[idx] ?? "";
      }
      return "";
    };
    const pnl = Number(get(["pnl", "profit", "p/l", "net"])) || 0;
    if (!pnl && !get(["instrument", "symbol"])) continue;
    rows.push({
      date: get(["date", "time"]).slice(0, 10) || new Date().toISOString().slice(0, 10),
      instrument: (get(["instrument", "symbol"]) || "XAUUSD").toUpperCase(),
      side: /sell|short/i.test(get(["side", "type"])) ? "SELL" : "BUY",
      size: Number(get(["size", "lots", "qty"])) || 0,
      entry: Number(get(["entry", "open"])) || 0,
      exit: Number(get(["exit", "close"])) || 0,
      pnl,
      notes: get(["notes", "comment"]) || "",
    });
  }
  return rows;
}
