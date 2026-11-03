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
    <section className="mt-10 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">Killzones · New York time</p>
          <p className="mt-2 flex items-center gap-3 text-xl font-medium sm:text-2xl">
            <span className="relative flex h-2 w-2">
              <span className={`relative inline-flex h-2 w-2 rounded-full ${liveKill ? "bg-brand" : "bg-muted-foreground/40"}`} />
            </span>
            {now === null ? "—" : liveKill ? `${liveKill.name} is live` : "Quiet hours"}
          </p>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {next && now !== null ? <>Next: <span className="text-foreground">{next.name}</span> in {fmt(until(now, next.start))}</> : " "}
        </p>
      </div>

      {/* 24h track */}
      <div className="relative mt-6 h-8 rounded-lg bg-muted">
        {ZONES.map((z) => {
          const segs = z.start < z.end ? [[z.start, z.end]] : [[z.start, 1440], [0, z.end]];
          const on = active.includes(z);
          return segs.map(([s, e], i) => (
            <div key={z.name + i} title={z.name}
              className={`absolute top-1 bottom-1 rounded-md transition-opacity duration-300 ${z.kill ? "bg-brand" : "bg-foreground/15"} ${z.kill ? (on ? "opacity-100" : "opacity-30") : ""}`}
              style={{ left: `${(s! / 1440) * 100}%`, width: `${((e! - s!) / 1440) * 100}%` }} />
          ));
        })}
        {now !== null && (
          <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground transition-[left] duration-700" style={{ left: `${(now / 1440) * 100}%` }} />
        )}
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
        {[0, 6, 12, 18, 24].map((h) => <span key={h}>{String(h).padStart(2, "0")}</span>)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        {ZONES.map((z) => {
          const on = active.includes(z);
          return (
            <div key={z.name} className={`rounded-xl border p-4 transition-colors duration-300 ${on ? "bg-secondary" : ""}`}>
              <p className={`text-sm font-medium ${on ? "text-brand" : ""}`}>{z.name}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{hhmm(z.start)}–{hhmm(z.end)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
