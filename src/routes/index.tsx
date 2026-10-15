import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { computeSignal, eventBias, type Asset, type Bias, type NewsEvent, type Signal } from "@/lib/signals";
import { getAiAnalysis, getCalendar, saveActual } from "@/lib/market.functions";
import { SiteNav } from "@/components/SiteNav";

const calendarQuery = queryOptions({ queryKey: ["calendar"], queryFn: () => getCalendar(), staleTime: 60_000 });
const aiQuery = queryOptions({ queryKey: ["ai-analysis"], queryFn: () => getAiAnalysis({ data: {} }), staleTime: 60_000, refetchInterval: 60_000 });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "TOPTIERclub — News-driven gold signals" },
      { name: "description", content: "High-impact economic news analysed into BUY/SELL bias with a confidence score for XAUUSD." },
      { property: "og:title", content: "TOPTIERclub — News-driven gold signals" },
      { property: "og:description", content: "Red-folder news in, confidence-scored gold bias out." },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(calendarQuery), context.queryClient.ensureQueryData(aiQuery)]),
  errorComponent: () => <div className="p-20 text-center text-muted-foreground">The calendar couldn't load. Try again shortly.</div>,
  notFoundComponent: () => <div className="p-20 text-center text-muted-foreground">Not found</div>,
  component: Index,
});

const toneText: Record<Bias, string> = { bullish: "text-bull", bearish: "text-bear", neutral: "text-muted-foreground" };

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Index() {
  const { data } = useSuspenseQuery(calendarQuery);
  const now = useNow();
  const [what, setWhat] = useState<Record<string, number>>({});
  const events = useMemo(
    () => data.events.map((e): NewsEvent => (e.id in what ? { ...e, actual: what[e.id] ?? null } : e)),
    [data.events, what],
  );
  // Signal = red news released in the last 24 hours (plus any what-if values).
  const recent = useMemo(() => {
    if (!now) return [];
    const since = now.getTime() - 24 * 3600e3;
    return events.filter((e) => e.id in what || (new Date(e.time).getTime() >= since && new Date(e.time) <= now));
  }, [events, now, what]);
  const gold = computeSignal(recent, "XAUUSD");
  const [open, setOpen] = useState<string | null>(null);
  const labEvents = events.filter((e) => e.forecast !== null && (!now || new Date(e.time) >= new Date(now.getTime() - 24 * 3600e3))).slice(0, 4);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 hidden select-none text-outline-giant text-[12rem] lg:block">
        TOPTIER<br />club
      </div>
      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-5 sm:px-10">
        <section className="pt-16 pb-14 sm:pt-28 sm:pb-20">
          <h1 className="animate-blur-in text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Read the news.<br /><span className="text-muted-foreground">Not the noise.</span>
          </h1>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">XAUUSD · GOLD SPOT · RED FOLDER ONLY</p>
          <p className="mt-8 max-w-lg text-lg text-muted-foreground animate-blur-in [animation-delay:200ms]">
            Every high-impact release is scored against forecast and turned into a directional bias —
            with an honest confidence, never a guarantee.
          </p>
          <NextNews events={events} now={now} />
        </section>

        <section id="signals" className="scroll-mt-24">
          <SignalCard s={gold} name="Gold Spot / USD" />
        </section>

        <AiSection />

        <section id="news" className="mt-24 scroll-mt-24">
          <Heading k="02" title="This week's red news" sub="USD high-impact events, New York time (UTC-4). Click a released event to see why it moves the market." />
          {data.error && <p className="mb-4 text-sm text-bear">{data.error}</p>}
          <div className="divide-y rounded-2xl border">
            {events.length === 0 && <p className="px-6 py-14 text-center text-sm text-muted-foreground">No red-folder USD events this week.</p>}
            {events.map((e) => (
              <NewsRow key={e.id} e={data.events.find((x) => x.id === e.id)!} now={now} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
            ))}
          </div>
        </section>

        <section id="lab" className="mt-24 scroll-mt-24">
          <Heading k="03" title="What-if lab" sub="Drag a number and watch the signals react. Nothing is saved." />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {labEvents.length === 0 && <p className="rounded-2xl border px-6 py-10 text-center text-sm text-muted-foreground sm:col-span-2">No upcoming red-news figures with a forecast to play with right now.</p>}
            {labEvents.map((e) => {
              const fc = e.forecast as number;
              const v = what[e.id] ?? e.actual ?? fc;
              const span = Math.max(Math.abs(fc) * 0.6, 0.3);
              return (
                <div key={e.id} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{e.title}</span>
                    <span className="font-mono text-2xl">{fmt(v)}{e.unit}</span>
                  </div>
                  <input
                    type="range" className="mt-5 w-full accent-gold"
                    min={fc - span} max={fc + span} step={span / 50} value={v}
                    onChange={(ev) => setWhat({ ...what, [e.id]: Number(ev.target.value) })}
                  />
                  <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
                    <span>forecast {fc}{e.unit}</span>
                    <span className={toneText[eventBias({ ...e, actual: v }, "XAUUSD")]}>gold {eventBias({ ...e, actual: v }, "XAUUSD")}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(what).length > 0 && (
            <button onClick={() => setWhat({})} className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              ↺ Reset to real data
            </button>
          )}
        </section>

        <footer className="mt-32 border-t py-10 text-xs text-muted-foreground">
          Calendar from Forex Factory. Signals are educational analysis of economic news, not financial advice. Trading carries risk.
        </footer>
      </main>
    </div>
  );
}

function AiSection() {
  const { data } = useSuspenseQuery(aiQuery);
  const refresh = useServerFn(getAiAnalysis);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [showAllCalls, setShowAllCalls] = useState(false);
  const a = data.analysis;

  async function regenerate() {
    setBusy(true);
    const r = await refresh({ data: { refresh: true } });
    setBusy(false);
    if (r.analysis) qc.setQueryData(["ai-analysis"], r);
  }

  return (
    <section id="ai" className="mt-24 scroll-mt-24">
      <Heading k="AI" title="AI desk analysis" sub="The model reads this week's red news and writes the call — bias, confidence, and levels." />
      {data.error && <p className="mb-4 text-sm text-bear">{data.error}</p>}
      {!a ? (
        <p className="rounded-2xl border px-6 py-14 text-center text-sm text-muted-foreground">No AI analysis yet.</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-card p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Weekly outlook</p>
              {data.stage && (
                <span className="rounded-full border border-gold/40 px-3 py-1 font-mono text-xs uppercase tracking-widest text-gold">
                  {data.stage === "15m" ? "⚡ Final 15m call" : "24h outlook"}
                </span>
              )}
            </div>
            <p className="mt-3 max-w-3xl text-base leading-relaxed sm:text-lg">{a.outlook}</p>
          </div>
          <AiSignalCard label="XAUUSD" name="Gold Spot / USD" s={a.xauusd} />
          {a.events.some((ev) => "signal" in ev) && (
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Pre-release calls · before the news drops</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(() => {
                  const all = a.events.filter((ev) => "signal" in ev);
                  const shown = showAllCalls ? all : all.slice(0, 4);
                  return shown.map((ev, i) => {
                    const c = ev.signal === "BUY" ? "text-bull" : ev.signal === "SELL" ? "text-bear" : "text-muted-foreground";
                    return (
                      <div key={i} className="rounded-2xl border bg-card p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{ev.title}</p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">{ev.time ? new Date(ev.time).toLocaleString("en-GB", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" }) + " New York" : "—"} · {ev.released ? "released" : "upcoming"}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${c}`}>{ev.signal}</p>
                            <p className="font-mono text-xs text-muted-foreground">{ev.confidence}% · {ev.bias}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{ev.note}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                          <p><span className="font-mono uppercase tracking-widest text-muted-foreground">If beats</span><br />{ev.ifBeat}</p>
                          <p><span className="font-mono uppercase tracking-widest text-muted-foreground">If misses</span><br />{ev.ifMiss}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {a.events.filter((ev) => "signal" in ev).length > 4 && (
                <button
                  onClick={() => setShowAllCalls((v) => !v)}
                  className="mt-4 w-full rounded-lg border px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground sm:w-auto"
                >
                  {showAllCalls
                    ? "↑ Show less"
                    : `↓ Show ${a.events.filter((ev) => "signal" in ev).length - 4} more news`}
                </button>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              Generated {new Date(a.generatedAt).toLocaleString("en-GB", { timeZone: "America/New_York" })} New York
            </p>
            <button onClick={regenerate} disabled={busy}
              className="rounded-lg border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground disabled:opacity-50">
              {busy ? "Analysing…" : "↺ Re-analyse"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AiSignalCard({ label, name, s }: { label: string; name: string; s: { action: "BUY" | "SELL" | "NEUTRAL"; confidence: number; reasoning: string; entry: number | null; stopLoss: number | null; takeProfit: number | null } }) {
  const color = s.action === "BUY" ? "text-bull" : s.action === "SELL" ? "text-bear" : "text-muted-foreground";
  return (
    <div className="rounded-3xl border bg-card p-5 transition-colors hover:border-gold/40 sm:p-8">
      <p className="font-mono text-xs tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{name}</p>
      <div className="mt-6 flex items-baseline gap-4">
        <p className={`text-4xl font-bold tracking-[-0.04em] sm:text-5xl ${color}`}>{s.action}</p>
        <p className="font-mono text-xl text-muted-foreground">{s.confidence}%</p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.reasoning}</p>
    </div>
  );
}

function fmt(n: number) {
  return Math.abs(n) >= 10 ? n.toFixed(0) : n.toFixed(2).replace(/0$/, "");
}

function Heading({ k, title, sub }: { k: string; title: string; sub: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs text-muted-foreground">{k}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{title}</h2>
      </div>
      <p className="max-w-xs text-sm text-muted-foreground sm:text-right">{sub}</p>
    </div>
  );
}

function SignalCard({ s, name }: { s: Signal; name: string }) {
  const color = s.action === "BUY" ? "text-bull" : s.action === "SELL" ? "text-bear" : "text-muted-foreground";
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className="group rounded-3xl border bg-card p-5 transition-colors hover:border-gold/40 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground">XAUUSD</p>
          <p className="mt-1 text-sm text-muted-foreground">{name}</p>
          <p key={s.action} className={`mt-6 animate-blur-in text-5xl font-bold tracking-[-0.04em] sm:mt-8 sm:text-7xl ${color}`}>{s.action}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {s.drivers ? `Based on ${s.drivers} red-news release${s.drivers === 1 ? "" : "s"} in the last 24h` : "No released red news in the last 24h"}
          </p>
        </div>
        <div className="relative size-24 shrink-0 sm:size-36">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
            <circle
              cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className={`${color} transition-[stroke-dashoffset] duration-700`}
              strokeDasharray={c} strokeDashoffset={c * (1 - s.confidence / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl sm:text-3xl">{s.confidence}%</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BiasChip({ e, asset }: { e: NewsEvent; asset: Asset }) {
  if (e.forecast === null) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  if (e.actual === null) return <span className="font-mono text-xs text-muted-foreground">pending</span>;
  const b = eventBias(e, asset);
  return <span className={`font-mono text-xs ${toneText[b]}`}>{b === "bullish" ? "▲" : b === "bearish" ? "▼" : "■"} {b}</span>;
}

function NewsRow({ e, now, open, onToggle }: { e: NewsEvent; now: Date | null; open: boolean; onToggle: () => void }) {
  const t = new Date(e.time);
  const day = t.toLocaleDateString("en-GB", { weekday: "short", timeZone: "America/New_York" });
  const time = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" });
  const released = now ? t <= now : false;
  return (
    <div className={released ? "" : "opacity-90"}>
      <button onClick={onToggle} className="grid w-full grid-cols-[64px_1fr] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-faint sm:grid-cols-[110px_1fr_150px_140px] sm:gap-4 sm:px-6 sm:py-5">
        <span className="font-mono text-xs text-muted-foreground sm:text-sm">{day} {time}</span>
        <span className="flex items-center gap-2 sm:gap-3">
          <span className="size-2.5 shrink-0 rounded-sm bg-bear" />
          <span className="font-medium">{e.title}</span>
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{e.currency}</span>
        </span>
        <span className="col-span-2 pl-4 font-mono text-sm sm:col-span-1 sm:pl-0">
          {e.forecast === null ? <span className="text-muted-foreground">speech / no forecast</span> : (
            <>
              <span className={e.actual === null ? "text-muted-foreground" : ""}>{e.actual ?? "—"}{e.actual !== null && e.unit}</span>
              <span className="text-muted-foreground"> / {e.forecast}{e.unit}</span>
            </>
          )}
        </span>
        <span className="col-span-2 pl-4 sm:col-span-1 sm:pl-0">Gold <BiasChip e={e} asset="XAUUSD" /></span>
      </button>
      {open && (
        <div className="animate-blur-in space-y-4 px-4 pb-6 text-sm text-muted-foreground sm:px-6 sm:pl-[134px]">
          <p>{e.note}{e.previous !== null && <span className="font-mono text-xs"> · previous {e.previous}{e.unit}</span>}</p>
        </div>
      )}
    </div>
  );
}

function NextNews({ events, now }: { events: NewsEvent[]; now: Date | null }) {
  if (!now) return null;
  const next = events.find((e) => new Date(e.time) > now);
  if (!next) return null;
  const diff = new Date(next.time).getTime() - now.getTime();
  const h = Math.floor(diff / 3600e3);
  const m = Math.floor((diff % 3600e3) / 60e3);
  const s = Math.floor((diff % 60e3) / 1000);
  return (
    <div className="mt-10 flex items-center gap-4 font-mono text-sm">
      <span className="text-muted-foreground">Next red news</span>
      <span className="text-gold">{next.title}</span>
      <span>{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
    </div>
  );
}
