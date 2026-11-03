import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { computeSignal, eventBias, type NewsEvent } from "@/lib/signals";
import { getAiAnalysis, getCalendar } from "@/lib/market.functions";
import { SiteNav } from "@/components/SiteNav";
import { NewsList, toneText } from "@/components/NewsRow";
import { NextReleaseCard } from "@/components/NextReleaseCard";
import { SignalSummaryCard } from "@/components/SignalSummaryCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const calendarQuery = queryOptions({ queryKey: ["calendar"], queryFn: () => getCalendar(), staleTime: 60_000 });
const aiQuery = queryOptions({ queryKey: ["ai-analysis"], queryFn: () => getAiAnalysis({ data: {} }), staleTime: 60_000, refetchInterval: 60_000 });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "TOPTIERclub — gold news signals" },
      { name: "description", content: "High-impact USD news scored against forecast and turned into a gold (XAUUSD) bias with a confidence score." },
      { property: "og:title", content: "TOPTIERclub — gold news signals" },
      { property: "og:description", content: "Red-folder news in, confidence-scored gold bias out." },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(calendarQuery), context.queryClient.ensureQueryData(aiQuery)]),
  errorComponent: () => <div className="p-20 text-center text-muted-foreground">The calendar couldn't load. Try again shortly</div>,
  notFoundComponent: () => <div className="p-20 text-center text-muted-foreground">Not found</div>,
  component: Index,
});

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const steps = [
  { n: "1", title: "News is released", body: "Each high-impact USD figure lands on the calendar in New York time. Actuals fill in from official data minutes after release" },
  { n: "2", title: "Figure is scored against forecast", body: "The surprise versus forecast is weighed by how much that release usually moves gold" },
  { n: "3", title: "Bias and confidence are published", body: "You get BUY, SELL or NEUTRAL with a confidence that never reaches 100%, and the reason behind it" },
];

const faqs = [
  { q: "Where does the news come from", a: "The weekly calendar comes from Forex Factory. Released figures for CPI, payrolls, jobless claims, retail sales, GDP and PCE are filled from FRED, the St. Louis Fed's official data service" },
  { q: "How is confidence worked out", a: "Each release in the last 24 hours is scored by how far the actual landed from forecast and how strongly that release type usually moves gold. The scores are combined into one bias" },
  { q: "Why does confidence never reach 100%", a: "News moves markets in ways no model can promise. Capping confidence keeps the number honest" },
  { q: "When does the AI re-analyse", a: "Twice per red-news event: 24 hours before and 15 minutes before release. It also re-runs when a new week's calendar appears. You can re-analyse by hand at any time" },
  { q: "Is this financial advice", a: "No. Signals are educational analysis of economic news. Trading carries risk" },
];

function Index() {
  const { data } = useSuspenseQuery(calendarQuery);
  const now = useNow();
  const [what, setWhat] = useState<Record<string, number>>({});
  const events = useMemo(
    () => data.events.map((e): NewsEvent => (e.id in what ? { ...e, actual: what[e.id] ?? null } : e)),
    [data.events, what],
  );
  const recent = useMemo(() => {
    if (!now) return [];
    const since = now.getTime() - 24 * 3600e3;
    return events.filter((e) => e.id in what || (new Date(e.time).getTime() >= since && new Date(e.time) <= now));
  }, [events, now, what]);
  const gold = computeSignal(recent, "XAUUSD");
  const labEvents = events.filter((e) => e.forecast !== null && (!now || new Date(e.time) >= new Date(now.getTime() - 24 * 3600e3))).slice(0, 4);

  return (
    <div className="min-h-screen">
      <SiteNav />

      <main className="mx-auto max-w-6xl px-5 pb-8 sm:px-10">
        <section className="animate-blur-in grid grid-cols-1 items-center gap-10 pt-10 pb-16 sm:pt-20 sm:pb-24 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h1 className="text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-6xl">
              Gold bias from every red-news release
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
              High-impact USD figures are scored against forecast and turned into a BUY, SELL or NEUTRAL call for XAUUSD, with an honest confidence
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/desk" className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Open the desk</Link>
              <Link to="/calendar" className="text-sm text-muted-foreground transition-colors hover:text-foreground">See this week's news</Link>
            </div>
          </div>
          <NextReleaseCard events={events} now={now} />
        </section>

        <section aria-labelledby="how" className="border-t py-16 sm:py-24">
          <h2 id="how" className="text-2xl font-medium tracking-[-0.02em] sm:text-4xl">How a signal is made</h2>
          <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n}>
                <p className="font-mono text-sm text-brand">{s.n}</p>
                <p className="mt-3 text-lg font-medium">{s.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="results" className="border-t py-16 sm:py-24">
          <Heading id="results" title="Current signals" sub="Live from this week's calendar. Updates as figures are released" />
          <SignalSummaryCard
            label="XAUUSD · news score"
            action={gold.action}
            confidence={gold.confidence}
            reason={gold.drivers ? `Based on ${gold.drivers} red-news release${gold.drivers === 1 ? "" : "s"} in the last 24 hours` : "No red news released in the last 24 hours"}
          />
          <AiSection />
        </section>

        <section aria-labelledby="news" className="border-t py-16 sm:py-24">
          <Heading id="news" title="This week's red news" sub="USD high-impact events, New York time. Tap a released event to see why it moves gold" />
          {data.error && <p className="mb-4 text-sm text-bear">{data.error}</p>}
          <NewsList events={events} rawEvents={data.events} now={now} />
        </section>

        <section aria-labelledby="lab" className="border-t py-16 sm:py-24">
          <Heading id="lab" title="What-if lab" sub="Drag a number and watch the signal react. Nothing is saved" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {labEvents.length === 0 && <p className="rounded-2xl border px-4 py-8 text-center text-sm text-muted-foreground sm:col-span-2">No upcoming figures with a forecast to try right now</p>}
            {labEvents.map((e) => {
              const fc = e.forecast as number;
              const v = what[e.id] ?? e.actual ?? fc;
              const span = Math.max(Math.abs(fc) * 0.6, 0.3);
              const b = eventBias({ ...e, actual: v }, "XAUUSD");
              return (
                <div key={e.id} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">{e.title}</span>
                    <span className="font-mono text-xl">{fmt(v)}{e.unit}</span>
                  </div>
                  <input type="range" aria-label={`${e.title} what-if value`} className="mt-4 w-full accent-brand"
                    min={fc - span} max={fc + span} step={span / 50} value={v}
                    onChange={(ev) => setWhat({ ...what, [e.id]: Number(ev.target.value) })} />
                  <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
                    <span>Forecast {fc}{e.unit}</span>
                    <span className={toneText[b]}>Gold {b}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(what).length > 0 && (
            <button onClick={() => setWhat({})} className="mt-4 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">Reset to real data</button>
          )}
        </section>

        <section aria-labelledby="faq" className="border-t py-16 sm:py-24">
          <h2 id="faq" className="text-2xl font-medium tracking-[-0.02em] sm:text-4xl">Questions</h2>
          <Accordion type="single" collapsible className="mt-8 max-w-3xl">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-base font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="border-t py-16 sm:py-24">
          <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.02em] sm:text-5xl">Plan the next release on the desk</h2>
          <p className="mt-4 max-w-md text-muted-foreground">Chart, fib levels, killzones and a lot-size calculator for XAUUSD</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/desk" className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Open the desk</Link>
          </div>
        </section>

        <footer className="border-t py-8 text-xs text-muted-foreground sm:py-10">
          Calendar from Forex Factory, released figures from FRED. Signals are educational analysis of economic news, not financial advice. Trading carries risk.
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
    <div className="mt-8">
      <p className="mb-4 text-sm text-muted-foreground">AI desk analysis</p>
      {data.error && <p className="mb-4 text-sm text-bear">{data.error}</p>}
      {!a ? (
        <p className="rounded-2xl border px-4 py-10 text-center text-sm text-muted-foreground">No AI analysis yet</p>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-2xl border bg-card p-4 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground">Weekly outlook</p>
              {data.stage && (
                <span className="font-mono text-xs text-brand">
                  {data.stage === "15m" ? "Final 15m call" : "24h outlook"}
                </span>
              )}
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed sm:text-lg">{a.outlook}</p>
          </div>
          <SignalSummaryCard label="XAUUSD · AI call" action={a.xauusd.action} confidence={a.xauusd.confidence} reason={a.xauusd.reasoning} />
          {a.events.some((ev) => "signal" in ev) && (
            <div>
              <p className="mb-3 font-mono text-xs text-muted-foreground">Pre-release calls</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {(() => {
                  const all = a.events.filter((ev) => "signal" in ev);
                  const shown = showAllCalls ? all : all.slice(0, 4);
                  return shown.map((ev, i) => {
                    const c = ev.signal === "BUY" ? "text-bull" : ev.signal === "SELL" ? "text-bear" : "text-muted-foreground";
                    return (
                      <div key={i} className="rounded-2xl border bg-card p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{ev.title}</p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">{ev.time ? new Date(ev.time).toLocaleString("en-GB", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" }) + " New York" : "—"} · {ev.released ? "released" : "upcoming"}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-medium sm:text-2xl ${c}`}>{ev.signal}</p>
                            <p className="font-mono text-xs text-muted-foreground">{ev.confidence}% · {ev.bias}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{ev.note}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                          <p><span className="font-mono text-muted-foreground">If beats</span><br />{ev.ifBeat}</p>
                          <p><span className="font-mono text-muted-foreground">If misses</span><br />{ev.ifMiss}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {a.events.filter((ev) => "signal" in ev).length > 4 && (
                <button
                  onClick={() => setShowAllCalls((v) => !v)}
                  className="mt-3 w-full rounded-lg border px-4 py-2.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground sm:w-auto"
                >
                  {showAllCalls
                    ? "Show less"
                    : `Show ${a.events.filter((ev) => "signal" in ev).length - 4} more news`}
                </button>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              Generated {new Date(a.generatedAt).toLocaleString("en-GB", { timeZone: "America/New_York" })} New York
            </p>
            <button onClick={regenerate} disabled={busy}
              className="rounded-lg border px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 sm:px-4 sm:py-2">
              {busy ? "Analysing…" : "Re-analyse"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(n: number) {
  return Math.abs(n) >= 10 ? n.toFixed(0) : n.toFixed(2).replace(/0$/, "");
}

function Heading({ id, title, sub }: { id: string; title: string; sub: string }) {
  return (
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <h2 id={id} className="text-2xl font-medium tracking-[-0.02em] sm:text-4xl">{title}</h2>
      <p className="max-w-xs text-sm text-muted-foreground sm:text-right">{sub}</p>
    </div>
  );
}
