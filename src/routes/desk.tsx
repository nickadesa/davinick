import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCandles } from "@/lib/market.functions";
import type { Candle } from "@/lib/signals";
import { SiteNav } from "@/components/SiteNav";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "1Y", label: "1Y" },
  { id: "ALL", label: "ALL" },
];

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
  const periodLabel = tf === "1D" ? "Today" : tf === "1W" ? "Past Week" : tf === "1M" ? "Past Month" : tf === "3M" ? "Past 3 Months" : tf === "1Y" ? "Past Year" : "All Time";

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteNav />
      <main className="mx-auto max-w-lg px-5 pb-24 pt-6">
        <p className="font-mono text-sm text-neutral-400">XAU/USD</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
          {last?.toFixed(2) ?? "—"}
        </p>
        {change != null && changePct != null && (
          <p className={`mt-2 text-sm font-medium ${up ? "text-green-500" : "text-red-500"}`}>
            {up ? "▲" : "▼"} {change.toFixed(2)} ({changePct.toFixed(2)}%) <span className="text-neutral-400">{periodLabel}</span>
          </p>
        )}

        {data?.error && <p className="mt-4 text-sm text-red-500">{data.error}</p>}
        <div className="mt-8">
          {candles.length > 0 ? (
            <LineChart candles={candles} up={up} />
          ) : (
            <div className="h-64 animate-pulse rounded-lg bg-neutral-900" />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between px-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTf(t.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                tf === t.id ? "bg-green-500 text-black" : "text-green-500 hover:text-green-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function LineChart({ candles, up }: { candles: Candle[]; up: boolean }) {
  const W = 1000, H = 380, pad = 4;
  const prices = candles.map((c) => c.c);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const y = (p: number) => pad + ((max - p) / range) * (H - pad * 2);
  const step = (W - pad * 2) / Math.max(1, candles.length - 1);
  const points = candles.map((c, i) => `${pad + i * step},${y(c.c)}`).join(" ");
  const color = up ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
