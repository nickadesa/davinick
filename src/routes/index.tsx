import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { computeSignal, eventBias, type Asset, type Bias, type NewsEvent, type Signal } from "@/lib/signals";
import { newsEvents } from "@/lib/news-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Red Box — News-driven signals for Gold & Nasdaq" },
      { name: "description", content: "High-impact economic news analysed into BUY/SELL bias with a confidence score for XAUUSD and Nasdaq." },
      { property: "og:title", content: "Red Box — News-driven signals for Gold & Nasdaq" },
      { property: "og:description", content: "Red-folder news in, confidence-scored bias out. XAUUSD & Nasdaq." },
    ],
  }),
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
  const [what, setWhat] = useState<Record<string, number>>({});
  const events = useMemo(
    () => newsEvents.map((e) => (e.id in what ? { ...e, actual: what[e.id] } : e)),
    [what],
  );
  const gold = computeSignal(events, "XAUUSD");
  const ndx = computeSignal(events, "NASDAQ");
  const [open, setOpen] = useState<string | null>("cpi");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 select-none text-outline-giant text-[22rem]">
        RED<br />BOX
      </div>

      <nav className="glass sticky top-4 z-20 mx-auto mt-4 flex w-fit items-center gap-8 rounded-full border px-5 py-2.5 text-sm">
        <span className="font-bold tracking-tight">RED<span className="text-muted-foreground">BOX</span></span>
        <a href="#signals" className="text-muted-foreground transition-colors hover:text-foreground">Signals</a>
        <a href="#news" className="text-muted-foreground transition-colors hover:text-foreground">News</a>
        <a href="#lab" className="text-muted-foreground transition-colors hover:text-foreground">What-if</a>
        <span className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-primary-foreground font-medium">
          <span className="size-1.5 rounded-full bg-bull animate-pulse-dot" /> Live
        </span>
      </nav>

      <main className="relative mx-auto max-w-6xl px-10">
        <section className="pt-28 pb-20">
          <h1 className="animate-blur-in text-7xl font-bold leading-[0.95] tracking-[-0.04em]">
            Read the news.<br /><span className="text-muted-foreground">Not the noise.</span>
          </h1>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">XAUUSD · NASDAQ 100 · RED FOLDER ONLY</p>
          <p className="mt-8 max-w-lg text-lg text-muted-foreground animate-blur-in [animation-delay:200ms]">
            Every high-impact release is scored against forecast and turned into a directional bias —
            with an honest confidence, never a guarantee.
          </p>
          <NextNews events={events} />
        </section>

        <section id="signals" className="grid grid-cols-2 gap-5 scroll-mt-24">
          <SignalCard s={gold} name="Gold Spot / USD" />
          <SignalCard s={ndx} name="US Tech 100" />
        </section>

        <section id="news" className="mt-24 scroll-mt-24">
          <Heading k="02" title="Today's red box" sub="Click an event to see why it moves the market." />
          <div className="divide-y rounded-2xl border">
            {events.map((e) => (
              <NewsRow key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
            ))}
          </div>
        </section>

        <section id="lab" className="mt-24 scroll-mt-24">
          <Heading k="03" title="What-if lab" sub="Drag a number before it's released and watch the signals react." />
          <div className="grid grid-cols-2 gap-5">
            {newsEvents.filter((e) => e.forecast !== 0).map((e) => {
              const v = what[e.id] ?? e.actual ?? e.forecast;
              const span = Math.max(Math.abs(e.forecast) * 0.6, 0.3);
              return (
                <div key={e.id} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{e.title}</span>
                    <span className="font-mono text-2xl">{fmt(v)}{e.unit}</span>
                  </div>
                  <input
                    type="range" className="mt-5 w-full accent-gold"
                    min={e.forecast - span} max={e.forecast + span} step={span / 50} value={v}
                    onChange={(ev) => setWhat({ ...what, [e.id]: Number(ev.target.value) })}
                  />
                  <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
                    <span>forecast {e.forecast}{e.unit}</span>
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
          Signals are educational analysis of economic news, not financial advice. Trading carries risk.
        </footer>
      </main>
    </div>
  );
}

function fmt(n: number) {
  return Math.abs(n) >= 10 ? n.toFixed(0) : n.toFixed(2).replace(/0$/, "");
}

function Heading({ k, title, sub }: { k: string; title: string; sub: string }) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <p className="font-mono text-xs text-muted-foreground">{k}</p>
        <h2 className="mt-2 text-4xl font-bold tracking-[-0.03em]">{title}</h2>
      </div>
      <p className="max-w-xs text-right text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function SignalCard({ s, name }: { s: Signal; name: string }) {
  const color = s.action === "BUY" ? "text-bull" : s.action === "SELL" ? "text-bear" : "text-muted-foreground";
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className="group rounded-3xl border bg-card p-8 transition-colors hover:border-gold/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground">{s.asset === "XAUUSD" ? "XAUUSD" : "NAS100"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{name}</p>
          <p key={s.action} className={`mt-8 animate-blur-in text-7xl font-bold tracking-[-0.04em] ${color}`}>{s.action}</p>
          <p className="mt-3 text-sm text-muted-foreground">Based on {s.drivers} released event{s.drivers === 1 ? "" : "s"}</p>
        </div>
        <div className="relative size-36">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
            <circle
              cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className={`${color} transition-[stroke-dashoffset] duration-700`}
              strokeDasharray={c} strokeDashoffset={c * (1 - s.confidence / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl">{s.confidence}%</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BiasChip({ e, asset }: { e: NewsEvent; asset: Asset }) {
  if (e.actual === null) return <span className="font-mono text-xs text-muted-foreground">pending</span>;
  const b = eventBias(e, asset);
  return <span className={`font-mono text-xs ${toneText[b]}`}>{b === "bullish" ? "▲" : b === "bearish" ? "▼" : "■"} {b}</span>;
}

function NewsRow({ e, open, onToggle }: { e: NewsEvent; open: boolean; onToggle: () => void }) {
  const t = new Date(e.time);
  const time = `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
  return (
    <div>
      <button onClick={onToggle} className="grid w-full grid-cols-[80px_1fr_150px_110px_110px] items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-faint">
        <span className="font-mono text-sm text-muted-foreground">{time}</span>
        <span className="flex items-center gap-3">
          <span className="size-2.5 rounded-sm bg-bear" />
          <span className="font-medium">{e.title}</span>
          <span className="font-mono text-xs text-muted-foreground">{e.currency}</span>
        </span>
        <span className="font-mono text-sm">
          {e.forecast === 0 ? <span className="text-muted-foreground">speech</span> : (
            <>
              <span className={e.actual === null ? "text-muted-foreground" : ""}>{e.actual ?? "—"}{e.actual !== null && e.unit}</span>
              <span className="text-muted-foreground"> / {e.forecast}{e.unit}</span>
            </>
          )}
        </span>
        <span>Gold <BiasChip e={e} asset="XAUUSD" /></span>
        <span>NDX <BiasChip e={e} asset="NASDAQ" /></span>
      </button>
      {open && (
        <div className="animate-blur-in px-6 pb-6 pl-[120px] text-sm text-muted-foreground">
          {e.note} <span className="font-mono text-xs">· previous {e.previous}{e.unit}</span>
        </div>
      )}
    </div>
  );
}

function NextNews({ events }: { events: NewsEvent[] }) {
  const now = useNow();
  const next = now && events.filter((e) => new Date(e.time) > now).sort((a, b) => a.time.localeCompare(b.time))[0];
  let label = "--:--:--";
  if (now && next) {
    const d = Math.floor((new Date(next.time).getTime() - now.getTime()) / 1000);
    label = [d / 3600, (d % 3600) / 60, d % 60].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":");
  }
  return (
    <div className="mt-12 inline-flex items-center gap-5 rounded-2xl border bg-card px-6 py-4">
      <span className="size-2 rounded-full bg-bear animate-pulse-dot" />
      <span className="text-sm text-muted-foreground">Next red news{next ? ` · ${next.title}` : ""}</span>
      <span className="font-mono text-2xl">{label}</span>
    </div>
  );
}
