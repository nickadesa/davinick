import { eventBias, type Asset, type Bias, type NewsEvent } from "@/lib/signals";

export const toneText: Record<Bias, string> = { bullish: "text-bull", bearish: "text-bear", neutral: "text-muted-foreground" };

function BiasChip({ e, asset }: { e: NewsEvent; asset: Asset }) {
  if (e.forecast === null) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  if (e.actual === null) return <span className="font-mono text-xs text-muted-foreground">pending</span>;
  const b = eventBias(e, asset);
  return <span className={`font-mono text-xs ${toneText[b]}`}>{b}</span>;
}

export function NewsRow({ e, now, open, onToggle }: { e: NewsEvent; now: Date | null; open: boolean; onToggle: () => void }) {
  const t = new Date(e.time);
  const day = t.toLocaleDateString("en-GB", { weekday: "short", timeZone: "America/New_York" });
  const time = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" });
  return (
    <div>
      <button onClick={onToggle} aria-expanded={open} className="grid w-full grid-cols-[64px_1fr] items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-faint focus-visible:outline-2 focus-visible:outline-ring sm:grid-cols-[112px_1fr_152px_140px] sm:gap-4 sm:px-6 sm:py-4">
        <span className="font-mono text-xs text-muted-foreground sm:text-sm">{day} {time}</span>
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium sm:text-base">{e.title}</span>
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{e.currency}</span>
        </span>
        <span className="col-span-2 font-mono text-xs sm:col-span-1 sm:text-sm">
          {e.forecast === null ? <span className="text-muted-foreground">No forecast</span> : (
            <>
              <span className={e.actual === null ? "text-muted-foreground" : ""}>{e.actual ?? "—"}{e.actual !== null && e.unit}</span>
              <span className="text-muted-foreground"> / {e.forecast}{e.unit}</span>
            </>
          )}
        </span>
        <span className="col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:text-sm">Gold <BiasChip e={e} asset="XAUUSD" /></span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground sm:px-6 sm:pb-6 sm:pl-[136px]">
          <p>{e.note}{e.previous !== null && <span className="font-mono text-xs"> · previous {e.previous}{e.unit}</span>}</p>
        </div>
      )}
    </div>
  );
}

export function NewsList({ events, rawEvents, now }: { events: NewsEvent[]; rawEvents?: NewsEvent[]; now: Date | null }) {
  return <NewsListInner events={events} rawEvents={rawEvents ?? events} now={now} />;
}

import { useState } from "react";
function NewsListInner({ events, rawEvents, now }: { events: NewsEvent[]; rawEvents: NewsEvent[]; now: Date | null }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="divide-y rounded-2xl border">
      {events.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No high-impact USD events this week</p>}
      {events.map((e) => (
        <NewsRow key={e.id} e={rawEvents.find((x) => x.id === e.id) ?? e} now={now} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
      ))}
    </div>
  );
}
