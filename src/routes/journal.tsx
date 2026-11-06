import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { WEEKDAYS, dailyNet, groupBy, inRange, isoDay, loadTrades, monthGrid, saveTrades, summary, weekdayOf, type Range, type Side, type Trade } from "@/lib/journal";
import { ShareDayButton } from "@/components/ShareDayButton";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trading journal — TOPTIERclub" },
      { name: "description", content: "Log your trades and see daily, weekly and monthly P&L. Stored in this browser only, no sign-in." },
      { property: "og:title", content: "Trading journal — TOPTIERclub" },
      { property: "og:description", content: "A private P&L calendar and trade log that stays on your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Journal,
});

const money = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const tone = (n: number) => (n > 0 ? "text-bull" : n < 0 ? "text-bear" : "text-muted-foreground");
const field = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-brand";

function Journal() {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => { setTrades(loadTrades()); setToday(new Date()); }, []);
  function update(list: Trade[]) { setTrades(list); saveTrades(list); }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-10">
      <section className="animate-blur-in pt-10 pb-6 sm:pt-14">
        <h1 className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl">Journal</h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">Trades are saved in this browser only. They stay on this device and are not sent anywhere</p>
      </section>
      {!trades || !today ? <Loading /> : <JournalBody trades={trades} today={today} onChange={update} />}
    </main>
  );
}

function Loading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

function JournalBody({ trades, today, onChange }: { trades: Trade[]; today: Date; onChange: (l: Trade[]) => void }) {
  const [range, setRange] = useState<Range>("month");
  const [instrument, setInstrument] = useState("all");
  const [side, setSide] = useState<"all" | Side>("all");
  const bounds = useMemo((): [number, number] => {
    const v = trades.map((t) => t.pnl);
    return v.length ? [Math.floor(Math.min(0, ...v)), Math.ceil(Math.max(0, ...v))] : [0, 0];
  }, [trades]);
  const [pnl, setPnl] = useState<number[] | null>(null);
  const pr: [number, number] = pnl ? [pnl[0] ?? bounds[0], pnl[1] ?? bounds[1]] : bounds;
  const instruments = [...new Set(trades.map((t) => t.instrument))].sort();
  const stats = summary(trades, today);
  const filtered = trades.filter((t) => inRange(t, range, today) && (instrument === "all" || t.instrument === instrument) && (side === "all" || t.side === side) && t.pnl >= pr[0] && t.pnl <= pr[1]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Today" value={money(stats.today)} cls={tone(stats.today)} />
        <Stat label="This week" value={money(stats.week)} cls={tone(stats.week)} />
        <Stat label="This month" value={money(stats.month)} cls={tone(stats.month)} />
        <Stat label="Trading days" value={String(stats.tradingDays)} />
      </div>

      <TradeForm today={today} onSave={(t) => { onChange([t, ...trades]); toast.success("Trade saved", { description: `${t.side} ${t.instrument} · ${money(t.pnl)}` }); }} />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <ToggleGroup type="single" value={range} onValueChange={(v) => v && setRange(v as Range)} className="rounded-lg bg-secondary p-1" aria-label="Period">
          {(["day", "week", "month", "all"] as const).map((r) => <ToggleGroupItem key={r} value={r} className="h-8 rounded-md px-3 text-sm capitalize data-[state=on]:bg-background">{r}</ToggleGroupItem>)}
        </ToggleGroup>
        <Select value={instrument} onValueChange={setInstrument}>
          <SelectTrigger className="h-9 w-40" aria-label="Instrument"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All instruments</SelectItem>{instruments.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={side} onValueChange={(v) => setSide(v as "all" | Side)}>
          <SelectTrigger className="h-9 w-32" aria-label="Side"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Both sides</SelectItem><SelectItem value="BUY">Buy</SelectItem><SelectItem value="SELL">Sell</SelectItem></SelectContent>
        </Select>
        <div className="flex min-w-56 flex-1 items-center gap-3 text-xs text-muted-foreground">
          <span>P&L</span>
          <Slider min={bounds[0]} max={bounds[1]} step={1} value={pr} onValueChange={setPnl} disabled={bounds[0] === bounds[1]} aria-label="P&L range" />
          <span className="font-mono whitespace-nowrap">{money(pr[0])} to {money(pr[1])}</span>
        </div>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4 space-y-6">
          <PnlCalendar trades={filtered} today={today} />
          <div className="grid gap-4 md:grid-cols-2">
            <BarList title="P&L by instrument" rows={groupBy(filtered, (t) => t.instrument)} />
            <BarList title="P&L by weekday" rows={groupBy(filtered, (t) => weekdayOf(t.date), WEEKDAYS)} />
          </div>
        </TabsContent>
        <TabsContent value="trades" className="mt-4">
          <TradeList trades={filtered} onDelete={(id) => { onChange(trades.filter((t) => t.id !== id)); toast("Trade deleted"); }} />
        </TabsContent>
        <TabsContent value="analysis" className="mt-4">
          <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">Analysis of your journal is coming in a later update</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-mono text-2xl tabular-nums", cls)}>{value}</p>
    </div>
  );
}

function TradeForm({ today, onSave }: { today: Date; onSave: (t: Trade) => void }) {
  const blank = { date: isoDay(today), instrument: "XAUUSD", side: "BUY" as Side, size: "", entry: "", exit: "", pnl: "", notes: "" };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = (s: string) => Number(s);
    if (!f.date || !f.instrument.trim() || f.pnl === "" || !Number.isFinite(num(f.pnl))) { toast.error("Add a date, instrument and P&L"); return; }
    onSave({ id: crypto.randomUUID(), date: f.date, instrument: f.instrument.trim().toUpperCase(), side: f.side, size: num(f.size) || 0, entry: num(f.entry) || 0, exit: num(f.exit) || 0, pnl: num(f.pnl), notes: f.notes.trim(), source: "Manual" });
    setF({ ...blank, date: f.date, instrument: f.instrument });
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-4 sm:p-6">
      <p className="text-sm font-medium">Add a trade</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="space-y-1 text-xs text-muted-foreground">Date<input type="date" value={f.date} onChange={set("date")} className={field} /></label>
        <label className="space-y-1 text-xs text-muted-foreground">Instrument<input value={f.instrument} onChange={set("instrument")} className={field} /></label>
        <div className="space-y-1 text-xs text-muted-foreground">Side
          <ToggleGroup type="single" value={f.side} onValueChange={(v) => v && setF({ ...f, side: v as Side })} className="justify-start gap-2" aria-label="Side">
            <ToggleGroupItem value="BUY" className="h-9 rounded-full border px-4 data-[state=on]:border-bull data-[state=on]:text-bull">BUY</ToggleGroupItem>
            <ToggleGroupItem value="SELL" className="h-9 rounded-full border px-4 data-[state=on]:border-bear data-[state=on]:text-bear">SELL</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <label className="space-y-1 text-xs text-muted-foreground">Size (lots)<input inputMode="decimal" value={f.size} onChange={set("size")} className={field} /></label>
        <label className="space-y-1 text-xs text-muted-foreground">Entry<input inputMode="decimal" value={f.entry} onChange={set("entry")} className={field} /></label>
        <label className="space-y-1 text-xs text-muted-foreground">Exit<input inputMode="decimal" value={f.exit} onChange={set("exit")} className={field} /></label>
        <label className="space-y-1 text-xs text-muted-foreground">P&L<input inputMode="decimal" placeholder="e.g. 120 or -45" value={f.pnl} onChange={set("pnl")} className={field} /></label>
        <label className="col-span-2 space-y-1 text-xs text-muted-foreground md:col-span-1">Notes<input value={f.notes} onChange={set("notes")} className={field} /></label>
      </div>
      <Button type="submit" className="mt-4 bg-brand text-primary-foreground hover:bg-brand/90">Save trade</Button>
    </form>
  );
}

function PnlCalendar({ trades, today }: { trades: Trade[]; today: Date }) {
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const net = dailyNet(trades);
  const cells = monthGrid(ym.y, ym.m);
  const shift = (d: number) => { const x = new Date(ym.y, ym.m + d, 1); setYm({ y: x.getFullYear(), m: x.getMonth() }); };
  const countByDay = trades.reduce((acc, t) => { acc[t.date] = (acc[t.date] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{new Date(ym.y, ym.m, 1).toLocaleString("en-GB", { month: "long", year: "numeric" })}</p>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => shift(1)}><ChevronRight /></Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => d === null ? <div key={i} /> : (
          <div key={d} className={cn("relative flex aspect-square flex-col justify-between rounded-lg border p-1.5 sm:aspect-[4/3] sm:p-2", d === isoDay(today) && "border-brand")}>
            <span className="text-[10px] text-muted-foreground sm:text-xs">{Number(d.slice(8))}</span>
            {net[d] !== undefined && (
              <div className="flex items-end justify-between">
                <span className={cn("truncate font-mono text-[10px] tabular-nums sm:text-sm", tone(net[d]))}>{money(net[d])}</span>
                <ShareDayButton date={d} pnl={net[d]} tradeCount={countByDay[d] ?? 0} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BarList({ title, rows }: { title: string; rows: { name: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-6">
      <p className="text-sm font-medium">{title}</p>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No trades in this view</p> : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 truncate text-muted-foreground">{r.name}</span>
              <div className="h-6 flex-1 rounded bg-muted"><div className="h-full rounded bg-brand/40" style={{ width: `${(Math.abs(r.value) / max) * 100}%` }} /></div>
              <span className={cn("w-20 text-right font-mono tabular-nums", tone(r.value))}>{money(r.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TradeList({ trades, onDelete }: { trades: Trade[]; onDelete: (id: string) => void }) {
  if (!trades.length) return <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">No trades in this view yet. Add one above</div>;
  const days = [...new Set(trades.map((t) => t.date))].sort().reverse();
  const net = dailyNet(trades);
  const countByDay = trades.reduce((acc, t) => { acc[t.date] = (acc[t.date] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  return (
    <div className="space-y-4">
      {days.map((d) => (
        <section key={d} className="rounded-2xl border bg-card">
          <header className="flex items-center justify-between border-b px-4 py-3 text-sm">
            <span>{new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
            <div className="flex items-center gap-2">
              <span className={cn("font-mono tabular-nums", tone(net[d] ?? 0))}>{money(net[d] ?? 0)}</span>
              <ShareDayButton date={d} pnl={net[d] ?? 0} tradeCount={countByDay[d] ?? 0} />
            </div>
          </header>
          <ul className="divide-y">
            {trades.filter((t) => t.date === d).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <span className={t.side === "BUY" ? "text-bull" : "text-bear"}>{t.side}</span>
                <span>{t.instrument}</span>
                <span className="font-mono text-xs text-muted-foreground">{t.size} lots · {t.entry} → {t.exit}</span>
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{t.source}</span>
                {t.notes && <span className="w-full text-xs text-muted-foreground sm:order-last">{t.notes}</span>}
                <span className={cn("ml-auto font-mono tabular-nums", tone(t.pnl))}>{money(t.pnl)}</span>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Delete trade" onClick={() => onDelete(t.id)}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
