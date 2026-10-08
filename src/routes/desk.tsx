import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getCandles } from "@/lib/market.functions";
import { fibLevels, lotSize } from "@/lib/signals";
import type { Candle } from "@/lib/market.server";
import { SiteNav } from "@/components/SiteNav";

type Interval = "15min" | "1h" | "4h";
const candlesQuery = (interval: Interval) =>
  queryOptions({ queryKey: ["candles", interval], queryFn: () => getCandles({ data: { interval } }), staleTime: 5 * 60e3 });

export const Route = createFileRoute("/desk")({
  head: () => ({
    meta: [
      { title: "Gold signal desk — Red Box" },
      { name: "description", content: "Live XAUUSD chart with automatic 61.8% and 78.6% Fibonacci zones, a news-trading playbook and a lot size calculator." },
      { property: "og:title", content: "Gold signal desk — Red Box" },
      { property: "og:description", content: "Gold chart, fib zones, strategy and risk calculator in one place." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(candlesQuery("1h")),
  errorComponent: () => <div className="p-20 text-center text-muted-foreground">The desk couldn't load. Try again shortly.</div>,
  notFoundComponent: () => <div className="p-20 text-center text-muted-foreground">Not found</div>,
  component: Desk,
});

function swing(c: Candle[]) {
  let hi = 0, lo = 0;
  c.forEach((x, i) => { if (x.h > c[hi]!.h) hi = i; if (x.l < c[lo]!.l) lo = i; });
  const high = c[hi]!.h, low = c[lo]!.l;
  const trend: "up" | "down" = lo < hi ? "up" : "down";
  return { high, low, trend, ...fibLevels(high, low, trend) };
}

function Desk() {
  const [interval, setInterval] = useState<Interval>("1h");
  const { data } = useQuery(candlesQuery(interval));
  const candles = data?.candles ?? [];
  const sw = useMemo(() => (candles.length ? swing(candles) : null), [candles]);
  const last = candles.at(-1)?.c;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-10 pb-24">
        <section className="pt-24 pb-12">
          <h1 className="animate-blur-in text-6xl font-bold tracking-[-0.04em]">Signal desk.<br /><span className="text-muted-foreground">Gold, measured.</span></h1>
          <p className="mt-6 max-w-lg text-muted-foreground">Live XAUUSD with the golden-zone retracements drawn for you. News gives the direction, fib gives the entry.</p>
        </section>

        <div className="rounded-3xl border bg-card p-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest text-muted-foreground">XAUUSD · GOLD SPOT</p>
              <p className="mt-2 font-mono text-5xl">{last?.toFixed(2) ?? "—"}</p>
            </div>
            <div className="flex gap-1 rounded-full border p-1 font-mono text-xs">
              {(["15min", "1h", "4h"] as Interval[]).map((i) => (
                <button key={i} onClick={() => setInterval(i)}
                  className={`rounded-full px-4 py-1.5 ${i === interval ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {i.replace("min", "m").toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {data?.error && <p className="mt-6 text-sm text-bear">{data.error}</p>}
          {candles.length > 0 && sw ? <Chart candles={candles} sw={sw} /> : <div className="mt-8 h-[420px] animate-pulse rounded-2xl bg-muted/30" />}
          {sw && (
            <div className="mt-6 grid grid-cols-4 gap-4 border-t pt-6 font-mono text-sm">
              <Stat k="Swing" v={sw.trend === "up" ? "▲ Up-swing" : "▼ Down-swing"} tone={sw.trend === "up" ? "text-bull" : "text-bear"} />
              <Stat k="Fib 61.8%" v={sw.f618.toFixed(2)} tone="text-gold" />
              <Stat k="Fib 78.6%" v={sw.f786.toFixed(2)} tone="text-gold" />
              <Stat k="Golden zone" v={sw.trend === "up" ? "Look for buys" : "Look for sells"} />
            </div>
          )}
        </div>

        <Playbook />
        <Calculator price={last ?? null} />

        <p className="mt-16 border-t pt-8 text-xs text-muted-foreground">Prices from Twelve Data. Fib levels are drawn from the highest high and lowest low on screen. Educational only, not financial advice.</p>
      </main>
    </div>
  );
}

function Stat({ k, v, tone = "" }: { k: string; v: string; tone?: string }) {
  return <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p><p className={`mt-1 ${tone}`}>{v}</p></div>;
}

function Chart({ candles, sw }: { candles: Candle[]; sw: ReturnType<typeof swing> }) {
  const W = 1000, H = 420, pad = 8;
  const min = sw.low - (sw.high - sw.low) * 0.05, max = sw.high + (sw.high - sw.low) * 0.05;
  const y = (p: number) => pad + ((max - p) / (max - min)) * (H - pad * 2);
  const step = W / candles.length;
  const zoneTop = y(Math.max(sw.f618, sw.f786)), zoneBot = y(Math.min(sw.f618, sw.f786));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-8 h-[420px] w-full" preserveAspectRatio="none">
      <rect x={0} y={zoneTop} width={W} height={zoneBot - zoneTop} className="fill-gold/10" />
      {[{ p: sw.f618, l: "61.8%" }, { p: sw.f786, l: "78.6%" }].map((f) => (
        <g key={f.l}>
          <line x1={0} x2={W} y1={y(f.p)} y2={y(f.p)} className="stroke-gold" strokeDasharray="6 6" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={W - 6} y={y(f.p) - 6} textAnchor="end" className="fill-gold font-mono text-[11px]">{f.l} · {f.p.toFixed(2)}</text>
        </g>
      ))}
      {candles.map((c, i) => {
        const up = c.c >= c.o, x = i * step + step / 2;
        return (
          <g key={c.t} className={up ? "text-bull" : "text-bear"}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <rect x={x - step * 0.35} width={step * 0.7} y={y(Math.max(c.o, c.c))} height={Math.max(1, Math.abs(y(c.o) - y(c.c)))} fill="currentColor" />
          </g>
        );
      })}
    </svg>
  );
}

const steps = [
  { t: "Read the red box", d: "Check this week's high-impact USD news on the home page. Weak US data or a dovish Fed is gold-positive; hot inflation or strong jobs is gold-negative." },
  { t: "Wait for the release", d: "Don't trade the first spike. Let the first 5–15 minutes settle — spreads widen and price often fakes out." },
  { t: "Find the swing", d: "After the move, mark the impulse high and low. The desk chart does this automatically." },
  { t: "Enter in the golden zone", d: "Place limit entries between the 61.8% and 78.6% retracement, in the direction of the news bias." },
  { t: "Protect and target", d: "Stop just beyond the 100% level (the swing origin). First target at the swing extreme, aim for at least 1:2 risk-reward." },
  { t: "Size it right", d: "Risk 0.5–1% of your account per trade. Use the calculator below so the stop decides your lot size, not your feelings." },
];

function Playbook() {
  return (
    <section className="mt-24">
      <div className="mb-8 flex items-end justify-between">
        <div><p className="font-mono text-xs text-muted-foreground">STRATEGY</p><h2 className="mt-2 text-4xl font-bold tracking-[-0.03em]">News + fib playbook</h2></div>
        <p className="max-w-xs text-right text-sm text-muted-foreground">Six rules. Direction from the news, location from the fib.</p>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <div key={s.t} className="rounded-2xl border bg-card p-6 transition-colors hover:border-gold/40">
            <p className="font-mono text-xs text-gold">0{i + 1}</p>
            <p className="mt-3 font-medium">{s.t}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Calculator({ price }: { price: number | null }) {
  const [bal, setBal] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [stop, setStop] = useState("10");
  const lots = lotSize(Number(bal), Number(risk), Number(stop));
  const riskUsd = (Number(bal) * Number(risk)) / 100;
  const field = "mt-2 w-full rounded-lg border bg-background px-3 py-2 font-mono outline-none focus:border-gold";
  return (
    <section className="mt-24">
      <div className="mb-8 flex items-end justify-between">
        <div><p className="font-mono text-xs text-muted-foreground">RISK</p><h2 className="mt-2 text-4xl font-bold tracking-[-0.03em]">Lot size calculator</h2></div>
        <p className="max-w-xs text-right text-sm text-muted-foreground">Gold: 1 lot = 100 oz, so a $1 move is $100 per lot.</p>
      </div>
      <div className="grid grid-cols-[1fr_320px] gap-5 rounded-3xl border bg-card p-8">
        <div className="grid grid-cols-3 gap-5 text-sm">
          <label>Account balance ($)<input className={field} value={bal} onChange={(e) => setBal(e.target.value)} inputMode="decimal" /></label>
          <label>Risk per trade (%)<input className={field} value={risk} onChange={(e) => setRisk(e.target.value)} inputMode="decimal" /></label>
          <label>Stop distance ($){price && <span className="text-muted-foreground"> · gold {price.toFixed(0)}</span>}<input className={field} value={stop} onChange={(e) => setStop(e.target.value)} inputMode="decimal" /></label>
        </div>
        <div className="border-l pl-8">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Position size</p>
          <p className="mt-2 font-mono text-5xl text-gold">{lots.toFixed(2)}<span className="text-lg text-muted-foreground"> lots</span></p>
          <p className="mt-2 text-sm text-muted-foreground">Risking ${Number.isFinite(riskUsd) ? riskUsd.toFixed(2) : "—"}</p>
        </div>
      </div>
    </section>
  );
}
