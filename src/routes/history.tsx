import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getHistory } from "@/lib/market.functions";
import { outcome, type Action, type Outcome } from "@/lib/signals";
import { SiteNav } from "@/components/SiteNav";

const historyQuery = queryOptions({ queryKey: ["history"], queryFn: () => getHistory() });

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Signal history — TOPTIERclub" },
      { name: "description", content: "Every XAUUSD news signal, compared with the price 1 and 4 hours later." },
      { property: "og:title", content: "Signal history — TOPTIERclub" },
      { property: "og:description", content: "How did the news-driven signals actually perform?" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(historyQuery),
  errorComponent: () => <div className="p-20 text-center text-muted-foreground">History couldn't load. Try again shortly.</div>,
  notFoundComponent: () => <div className="p-20 text-center text-muted-foreground">Not found</div>,
  component: HistoryPage,
});

const pct = (a: number | null, b: number | null) => (a === null || b === null ? null : ((b - a) / a) * 100);
const outcomeStyle: Record<Outcome, string> = {
  win: "text-bull", loss: "text-bear", pending: "text-muted-foreground", skip: "text-muted-foreground",
};

function HistoryPage() {
  const { data } = useSuspenseQuery(historyQuery);
  const rows = data.rows.map((r) => ({
    ...r,
    entry: r.entry_price === null ? null : Number(r.entry_price),
    p1: r.price_1h === null ? null : Number(r.price_1h),
    p4: r.price_4h === null ? null : Number(r.price_4h),
  }));

  const stats = (["XAUUSD"] as const).map((asset) => {
    const scored = rows.filter((r) => r.asset === asset).map((r) => outcome(r.action as Action, r.entry, r.p4));
    const wins = scored.filter((o) => o === "win").length;
    const done = scored.filter((o) => o === "win" || o === "loss").length;
    return { asset, wins, done, rate: done ? Math.round((wins / done) * 100) : null };
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-10">
        <section className="pt-16 pb-10 sm:pt-24 sm:pb-14">
          <h1 className="animate-blur-in text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Signal history.<br /><span className="text-muted-foreground">Honest scorecard.</span></h1>
          <p className="mt-6 max-w-lg text-muted-foreground">Every signal is stored when a red-news figure comes out, then checked against the price 1 hour and 4 hours later. Wins are judged on the 4-hour move.</p>
        </section>

        <div className="grid grid-cols-1 gap-5">
          {stats.map((s) => (
            <div key={s.asset} className="rounded-3xl border bg-card p-6 sm:p-8">
              <p className="font-mono text-xs tracking-widest text-muted-foreground">{s.asset} · 4H HIT RATE</p>
              <p className="mt-4 font-mono text-5xl sm:text-6xl">{s.rate === null ? "—" : `${s.rate}%`}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.wins} correct out of {s.done} scored signals</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-x-auto rounded-2xl border">
          <div className="min-w-[780px]">
          <div className="grid grid-cols-[150px_90px_80px_1fr_110px_90px_90px_80px] gap-4 border-b px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span>Time (New York)</span><span>Asset</span><span>Signal</span><span>Triggered by</span><span>Entry</span><span>1h</span><span>4h</span><span>Result</span>
          </div>
          {rows.length === 0 && (
            <p className="px-6 py-14 text-center text-sm text-muted-foreground">No signals yet. They appear here once an actual figure is entered for a released red-news event.</p>
          )}
          {rows.map((r) => {
            const o = outcome(r.action as Action, r.entry, r.p4);
            const m1 = pct(r.entry, r.p1), m4 = pct(r.entry, r.p4);
            const d = new Date(r.created_at);
            return (
              <div key={r.id} className="grid grid-cols-[150px_90px_80px_1fr_110px_90px_90px_80px] items-center gap-4 border-b px-6 py-4 text-sm last:border-0">
                <span className="font-mono text-muted-foreground">{d.toLocaleString("en-GB", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" })}</span>
                <span className="font-mono">{r.asset}</span>
                <span className={`font-bold ${r.action === "BUY" ? "text-bull" : r.action === "SELL" ? "text-bear" : "text-muted-foreground"}`}>{r.action} <span className="font-mono text-xs font-normal text-muted-foreground">{r.confidence}%</span></span>
                <span className="truncate">{r.trigger_title}</span>
                <span className="font-mono">{r.entry?.toFixed(2) ?? "—"}</span>
                <Move v={m1} />
                <Move v={m4} />
                <span className={`font-mono text-xs uppercase ${outcomeStyle[o]}`}>{o === "skip" ? "—" : o}</span>
              </div>
            );
          })}
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Past results don't guarantee future performance. Not financial advice.</p>
      </main>
    </div>
  );
}

function Move({ v }: { v: number | null }) {
  if (v === null) return <span className="font-mono text-muted-foreground">…</span>;
  return <span className={`font-mono ${v >= 0 ? "text-bull" : "text-bear"}`}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>;
}
