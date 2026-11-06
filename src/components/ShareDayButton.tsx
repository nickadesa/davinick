import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";

export function ShareDayButton({ date, pnl, tradeCount }: { date: string; pnl: number; tradeCount: number }) {
  const [open, setOpen] = useState(false);
  const money = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <>
      <Button variant="ghost" size="icon" className="size-7" aria-label={`Share ${date}`} onClick={() => setOpen(true)}>
        <Share2 className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {date}</DialogTitle>
            <DialogDescription>
              {tradeCount} trade{tradeCount !== 1 ? "s" : ""} · Net {money(pnl)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>Card Picker integration is ready to connect here.</p>
            <p className="text-xs">Full card designer (styles, privacy, export) will be wired in the next step.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button disabled>Open Card Picker</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
