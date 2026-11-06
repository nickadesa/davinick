import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ShareSheet } from "./ShareSheet";

export function ShareDayButton({ date, pnl, tradeCount }: { date: string; pnl: number; tradeCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" className="size-7" aria-label={`Share ${date}`} onClick={() => setOpen(true)}>
        <Share2 className="size-3.5" />
      </Button>
      <ShareSheet
        open={open}
        onOpenChange={setOpen}
        data={{ date, pnl, tradeCount }}
      />
    </>
  );
}
