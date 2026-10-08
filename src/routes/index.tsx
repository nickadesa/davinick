import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { computeSignal, eventBias, type Asset, type Bias, type NewsEvent, type Signal } from "@/lib/signals";
import { getAiAnalysis, getCalendar, saveActual } from "@/lib/market.functions";
import { SiteNav } from "@/components/SiteNav";

const calendarQuery = queryOptions({ queryKey: ["calendar"], queryFn: () => getCalendar(), staleTime: 60_000 });
const aiQuery = queryOptions({ queryKey: ["ai-analysis"], queryFn: () => getAiAnalysis({ data: {} }), staleTime: 6 * 3600e3 });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Red Box — News-driven signals for Gold & Nasdaq" },
      { name: "description", content: "High-impact economic news analysed into BUY/SELL bias with a confidence score for XAUUSD and Nasdaq." },
      { property: "og:title", content: "Red Box — News-driven signals for Gold & Nasdaq" },
      { property: "og:description", content: "Red-folder news in, confidence-scored bias out. XAUUSD & Nasdaq." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(calendarQuery),
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
  const ndx = computeSignal(recent, "NASDAQ");
  const [open, setOpen] = useState<string | null>(null);
  const labEvents = events.filter((e) => e.forecast !== null && (!now || new Date(e.time) >= new Date(now.getTime() - 24 * 3600e3))).slice(0, 4);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 select-none text-outline-giant text-[22rem]">
        RED<br />BOX
      </div>
      <SiteNav />

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
          <NextNews events={events} now={now} />
        </section>

        <section id="signals" className="grid grid-cols-2 gap-5 scroll-mt-24">
          <SignalCard s={gold} name="Gold Spot / USD" />
          <SignalCard s={ndx} name="US Tech 100" />
        </section>

        <AiSection />

        <section id="news" className="mt-24 scroll-mt-24">
          <Heading k="02" title="This week's red box" sub="USD high-impact events. Click a released event to see why it moves the market." />
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
          <div className="grid grid-cols-2 gap-5">
            {labEvents.length === 0 && <p className="col-span-2 rounded-2xl border px-6 py-10 text-center text-sm text-muted-foreground">No upcoming red-news figures with a forecast to play with right now.</p>}
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
          <p className="mt-3 text-sm text-muted-foreground">
            {s.drivers ? `Based on ${s.drivers} red-news release${s.drivers === 1 ? "" : "s"} in the last 24h` : "No released red news in the last 24h"}
          </p>
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
  if (e.forecast === null) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  if (e.actual === null) return <span className="font-mono text-xs text-muted-foreground">pending</span>;
  const b = eventBias(e, asset);
  return <span className={`font-mono text-xs ${toneText[b]}`}>{b === "bullish" ? "▲" : b === "bearish" ? "▼" : "■"} {b}</span>;
}

function NewsRow({ e, now, open, onToggle }: { e: NewsEvent; now: Date | null; open: boolean; onToggle: () => void }) {
  const t = new Date(e.time);
  const day = t.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const time = `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
  const released = now ? t <= now : false;
  return (
    <div className={released ? "" : "opacity-90"}>
      <button onClick={onToggle} className="grid w-full grid-cols-[110px_1fr_150px_110px_110px] items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-faint">
        <span className="font-mono text-sm text-muted-foreground">{day} {time}</span>
        <span className="flex items-center gap-3">
          <span className="size-2.5 rounded-sm bg-bear" />
          <span className="font-medium">{e.title}</span>
          <span className="font-mono text-xs text-muted-foreground">{e.currency}</span>
        </span>
        <span className="font-mono text-sm">
          {e.forecast === null ? <span className="text-muted-foreground">speech / no forecast</span> : (
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
        <div className="animate-blur-in space-y-4 px-6 pb-6 pl-[134px] text-sm text-muted-foreground">
          <p>{e.note}{e.previous !== null && <span className="font-mono text-xs"> · previous {e.previous}{e.unit}</span>}</p>
          {released && e.forecast !== null && <ActualForm e={e} />}
        </div>
      )}
    </div>
  );
}

function ActualForm({ e }: { e: NewsEvent }) {
  const save = useServerFn(saveActual);
  const qc = useQueryClient();
  const router = useRouter();
  const [actual, setActual] = useState(e.actual?.toString() ?? "");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const n = Number(actual);
    if (actual.trim() === "" || !Number.isFinite(n)) return setMsg("Enter a number");
    setBusy(true);
    const r = await save({ data: { eventKey: e.id, actual: n, passcode: pass } });
    setBusy(false);
    setMsg(r.ok ? "Saved — signal recorded in history" : r.error);
    if (r.ok) { await qc.invalidateQueries({ queryKey: ["calendar"] }); qc.invalidateQueries({ queryKey: ["history"] }); router.invalidate(); }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-widest">Actual</span>
      <input value={actual} onChange={(x) => setActual(x.target.value)} inputMode="decimal" placeholder={`e.g. ${e.forecast}`}
        className="w-28 rounded-lg border bg-background px-3 py-2 font-mono text-foreground outline-none focus:border-gold" />
      <input value={pass} onChange={(x) => setPass(x.target.value)} type="password" placeholder="Passcode"
        className="w-36 rounded-lg border bg-background px-3 py-2 text-foreground outline-none focus:border-gold" />
      <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">
        {busy ? "Saving…" : "Save"}
      </button>
      {msg && <span className="text-xs">{msg}</span>}
    </form>
  );
}

function NextNews({ events, now }: { events: NewsEvent[]; now: Date | null }) {
  const next = now && events.find((e) => new Date(e.time) > now);
  let label = "--:--:--";
  if (now && next) {
    const d = Math.floor((new Date(next.time).getTime() - now.getTime()) / 1000);
    const days = Math.floor(d / 86400);
    const hms = [(d % 86400) / 3600, (d % 3600) / 60, d % 60].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":");
    label = days ? `${days}d ${hms}` : hms;
  }
  return (
    <div className="mt-12 inline-flex items-center gap-5 rounded-2xl border bg-card px-6 py-4">
      <span className="size-2 rounded-full bg-bear animate-pulse-dot" />
      <span className="text-sm text-muted-foreground">{next ? `Next red news · ${next.title}` : now ? "No more red news this week" : "Next red news"}</span>
      <span className="font-mono text-2xl">{next || !now ? label : ""}</span>
    </div>
  );
}
