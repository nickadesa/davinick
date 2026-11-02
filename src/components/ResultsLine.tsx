export type ResultPoint = { signal: number; reference: number };

/** Hand-drawn SVG so it renders during SSR. Values are cumulative % moves. */
export function ResultsLine({ points }: { points: ResultPoint[] }) {
  const W = 800, H = 240, P = 8;
  if (points.length < 2) {
    return <div className="flex h-60 items-center justify-center rounded-2xl border bg-card text-sm text-muted-foreground">The line appears once two signals have a 4-hour result</div>;
  }
  const all = points.flatMap((p) => [p.signal, p.reference, 0]);
  const min = Math.min(...all), max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - min) / span) * (H - 2 * P);
  const path = (k: keyof ResultPoint) => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  const last = points[points.length - 1]!;
  const f = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap gap-6 font-mono text-sm">
        <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-gold" />Signals <span className={last.signal >= 0 ? "text-bull" : "text-bear"}>{f(last.signal)}</span></span>
        <span className="flex items-center gap-2 text-muted-foreground"><span className="h-0.5 w-4 bg-muted-foreground" />Gold price <span>{f(last.reference)}</span></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-60 w-full" preserveAspectRatio="none" role="img" aria-label="Cumulative 4-hour result of signals compared with the gold price">
        <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={path("reference")} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <path d={path("signal")} fill="none" stroke="var(--gold)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
