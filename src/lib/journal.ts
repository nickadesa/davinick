export type Side = "BUY" | "SELL";
export type Trade = {
  id: string;
  date: string; // YYYY-MM-DD
  instrument: string;
  side: Side;
  size: number;
  entry: number;
  exit: number;
  pnl: number;
  notes: string;
  source: "Manual";
};
export type Range = "day" | "week" | "month" | "all";

export const JOURNAL_KEY = "toptier-journal-v1";

export function loadTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
export function saveTrades(list: Trade[]) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(list));
}

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseDay(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
/** Monday-start week key */
function weekStart(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return isoDay(x);
}

export function inRange(t: Trade, range: Range, today: Date) {
  const d = parseDay(t.date);
  if (range === "all") return true;
  if (range === "day") return t.date === isoDay(today);
  if (range === "week") return weekStart(d) === weekStart(today);
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
}

const sum = (list: Trade[]) => Math.round(list.reduce((a, t) => a + t.pnl, 0) * 100) / 100;

export function summary(list: Trade[], today: Date) {
  return {
    today: sum(list.filter((t) => inRange(t, "day", today))),
    week: sum(list.filter((t) => inRange(t, "week", today))),
    month: sum(list.filter((t) => inRange(t, "month", today))),
    tradingDays: new Set(list.map((t) => t.date)).size,
  };
}

export function dailyNet(list: Trade[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of list) out[t.date] = Math.round(((out[t.date] ?? 0) + t.pnl) * 100) / 100;
  return out;
}

export function groupBy(list: Trade[], key: (t: Trade) => string, order?: string[]) {
  const map = new Map<string, number>();
  for (const t of list) map.set(key(t), (map.get(key(t)) ?? 0) + t.pnl);
  const rows = [...map].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  return order ? order.filter((n) => map.has(n)).map((n) => rows.find((r) => r.name === n)!) : rows.sort((a, b) => b.value - a.value);
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function weekdayOf(date: string) {
  return WEEKDAYS[(parseDay(date).getDay() + 6) % 7];
}

/** Monthly grid: leading nulls so day 1 lands on its weekday (Mon start). */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => isoDay(new Date(year, month, i + 1)))];
}
