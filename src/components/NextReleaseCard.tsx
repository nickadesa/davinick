import type { NewsEvent } from "@/lib/signals";

const WINDOW = 24 * 3600e3;

export function NextReleaseCard({ events, now }: { events: NewsEvent[]; now: Date | null }) {
  const next = now ? events.find((e) => new Date(e.time) > now) : undefined;
  if (now && !next) {
    return (
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Next release</p>
        <p className="mt-4 text-lg">No more high-impact USD releases this week</p>
      </div>
    );
  }
  const diff = next && now ? new Date(next.time).getTime() - now.getTime() : null;
  const h = diff === null ? 0 : Math.floor(diff / 3600e3);
  const m = diff === null ? 0 : Math.floor((diff % 3600e3) / 60e3);
  const s = diff === null ? 0 : Math.floor((diff % 60e3) / 1000);
  const fill = diff === null ? 0 : Math.min(100, Math.max(0, (1 - diff / WINDOW) * 100));
  const soon = diff !== null && diff <= 3600e3;
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = next
    ? new Date(next.time).toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" }) + " New York"
    : "—";

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={`size-2 rounded-full ${soon ? "animate-pulse-dot bg-gold" : "bg-muted-foreground/50"}`} aria-hidden />
        Next release
      </div>
      <p className="mt-4 text-xl font-medium sm:text-2xl">{next?.title ?? "Loading calendar"}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{when}</p>
      <p className="mt-6 font-mono text-5xl tracking-[-0.02em] tabular-nums sm:text-7xl" aria-live="off">
        {pad(h)}:{pad(m)}:{pad(s)}
      </p>
      <div className="mt-6 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(fill)} aria-valuemin={0} aria-valuemax={100} aria-label="Time to release, last 24 hours">
        <div className="h-full rounded-full bg-gold transition-[width] duration-1000 ease-linear" style={{ width: `${fill}%` }} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 font-mono text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Forecast</dt>
          <dd className="mt-1">{next?.forecast ?? "—"}{next?.forecast != null && next.unit}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Previous</dt>
          <dd className="mt-1">{next?.previous ?? "—"}{next?.previous != null && next.unit}</dd>
        </div>
      </dl>
    </div>
  );
}
