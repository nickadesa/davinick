import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCandles } from "@/lib/market.functions";
import type { Candle } from "@/lib/signals";
import { KillzoneRadar } from "@/components/KillzoneRadar";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

const candlesQuery = (timeframe: Timeframe) =>
  queryOptions({
    queryKey: ["candles", "XAUUSD", timeframe],
    queryFn: () => getCandles({ data: { symbol: "XAUUSD", timeframe } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/desk")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Chart — TOPTIERclub" },
      { name: "description", content: "Live XAU/USD line chart." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(candlesQuery("1D")),
  errorComponent: () => <div className="p-20 text-center text-muted-foreground">The desk couldn't load. Try again shortly.</div>,
  component: Desk,
});

function Desk() {
  const [tf, setTf] = useState<Timeframe>("1D");
  const { data } = useQuery(candlesQuery(tf));
  const candles = data?.candles ?? [];
  const last = candles.at(-1)?.c;
  const first = candles[0]?.c;
  const change = last != null && first != null ? last - first : null;
  const changePct = change != null && first ? (change / first) * 100 : null;
  const up = (change ?? 0) >= 0;

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-5 pb-32 sm:px-8">
        <section className="pt-12 pb-6 sm:pt-16">
          <p className="font-mono text-sm text-muted-foreground">XAU/USD · Gold Spot</p>
          <p className="mt-2 text-5xl font-medium tracking-[-0.02em] tabular-nums sm:text-6xl">{last?.toFixed(2) ?? "—"}</p>
          {change != null && changePct != null && (
            <p className={`mt-2 font-mono text-sm ${up ? "text-bull" : "text-bear"}`}>
              {up ? "▲" : "▼"} {change.toFixed(2)} ({changePct.toFixed(2)}%) <span className="text-muted-foreground">vs start of {tf}</span>
            </p>
          )}
        </section>

        {data?.error && <p className="mb-4 text-sm text-bear">{data.error}</p>}
        {candles.length > 0 ? (
          <LineChart candles={candles} up={up} />
        ) : (
          <div className="h-64 rounded-2xl border bg-card sm:h-80" />
        )}

        <div role="tablist" aria-label="Timeframe" className="mt-4 flex gap-1 rounded-xl border p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              role="tab" aria-selected={tf === t}
              className={`h-9 flex-1 rounded-lg font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                tf === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <KillzoneRadar />
      </main>
    </div>
  );
}

function LineChart({ candles, up }: { candles: Candle[]; up: boolean }) {
  const W = 800, H = 320, pad = 12;
  const prices = candles.map((c) => c.c);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const y = (p: number) => pad + ((max - p) / range) * (H - pad * 2);
  const step = (W - pad * 2) / Math.max(1, candles.length - 1);
  const points = candles.map((c, i) => `${pad + i * step},${y(c.c)}`).join(" ");
  const color = up ? "var(--bull)" : "var(--bear)";

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-6">
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full sm:h-80" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2" vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
    <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground"><span>low {min.toFixed(2)}</span><span>high {max.toFixed(2)}</span></div>
    </div>
  );
}
