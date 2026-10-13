import { useEffect, useState } from "react";

/** Trading sessions in New York minutes-of-day. Asian wraps past midnight. */
const ZONES = [
  { name: "Asian range", start: 19 * 60, end: 4 * 60, kill: false },
  { name: "London open", start: 2 * 60, end: 5 * 60, kill: true },
  { name: "New York open", start: 7 * 60, end: 10 * 60, kill: true },
  { name: "London close", start: 10 * 60, end: 12 * 60, kill: true },
];

function nyMinutes(d: Date) {
  const [h, m] = d.toLocaleTimeString("en-GB", { timeZone: "America/New_York", hour12: false, hour: "2-digit", minute: "2-digit" }).split(":").map(Number);
  return (h! % 24) * 60 + m!;
}
const inZone = (t: number, s: number, e: number) => (s < e ? t >= s && t < e : t >= s || t < e);
const until = (t: number, s: number) => (s - t + 1440) % 1440;
const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:00`;

export function KillzoneRadar() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(nyMinutes(new Date()));
    tick();
    const id = window.setInterval(tick, 30e3);
    return () => window.clearInterval(id);
  }, []);

  const active = now === null ? [] : ZONES.filter((z) => inZone(now, z.start, z.end));
  const liveKill = active.find((z) => z.kill);
  const next = now === null ? null : ZONES.filter((z) => z.kill && !inZone(now, z.start, z.end)).sort((a, b) => until(now, a.start) - until(now, b.start))[0];

  return (
    <section className="mt-10 rounded-3xl border border-border/60 bg-card/60 p-5 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--foreground)_8%,transparent)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground">KILLZONE RADAR · NEW YORK TIME</p>
          <p className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            <span className="relative flex h-3 w-3">
              {liveKill && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:animate-none" />}
              <span className={`relative inline-flex h-3 w-3 rounded-full ${liveKill ? "bg-gold" : "bg-muted-foreground/40"}`} />
            </span>
            {now === null ? "—" : liveKill ? `${liveKill.name} is live` : "Quiet hours"}
          </p>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {next && now !== null ? <>Next: <span className="text-foreground">{next.name}</span> in {fmt(until(now, next.start))}</> : " "}
        </p>
      </div>

      {/* 24h track */}
      <div className="relative mt-8 h-10 rounded-full bg-muted/30">
        {ZONES.map((z) => {
          const segs = z.start < z.end ? [[z.start, z.end]] : [[z.start, 1440], [0, z.end]];
          const on = active.includes(z);
          return segs.map(([s, e], i) => (
            <div key={z.name + i} title={z.name}
              className={`absolute top-1 bottom-1 rounded-full transition-opacity duration-500 ${z.kill ? "bg-gold" : "bg-foreground/15"} ${z.kill ? (on ? "opacity-90" : "opacity-35") : ""}`}
              style={{ left: `${(s! / 1440) * 100}%`, width: `${((e! - s!) / 1440) * 100}%` }} />
          ));
        })}
        {now !== null && (
          <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground transition-[left] duration-700" style={{ left: `${(now / 1440) * 100}%` }} />
        )}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        {[0, 6, 12, 18, 24].map((h) => <span key={h}>{String(h).padStart(2, "0")}</span>)}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ZONES.map((z) => {
          const on = active.includes(z);
          return (
            <div key={z.name} className={`rounded-2xl border p-4 transition-colors duration-300 ${on ? "border-gold/50 bg-gold/10" : "border-border/60"}`}>
              <p className={`text-sm font-medium ${on ? "text-gold" : ""}`}>{z.name}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{hhmm(z.start)}–{hhmm(z.end)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
