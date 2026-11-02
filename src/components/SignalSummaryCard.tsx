type Action = "BUY" | "SELL" | "NEUTRAL";

export function SignalSummaryCard({ label, action, confidence, reason, children }: { label: string; action: Action; confidence: number; reason: string; children?: React.ReactNode }) {
  const color = action === "BUY" ? "text-bull" : action === "SELL" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-4 flex items-baseline gap-4">
        <p className={`text-5xl font-medium tracking-[-0.02em] sm:text-6xl ${color}`}>{action}</p>
        <p className="font-mono text-lg text-muted-foreground sm:text-xl">{confidence}% confidence</p>
      </div>
      <p className="mt-4 line-clamp-2 max-w-2xl text-sm text-muted-foreground">{reason}</p>
      {children}
    </div>
  );
}
