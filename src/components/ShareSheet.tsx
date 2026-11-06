import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ShareData = {
  date: string;
  pnl: number;
  tradeCount: number;
};

const STYLES = [
  { id: "minimal", name: "Minimal", desc: "ตัวเลขใหญ่ อ่านง่าย" },
  { id: "chart", name: "Chart", desc: "มีกราฟเล็ก" },
  { id: "exchange", name: "Exchange", desc: "สไตล์แอปเทรด" },
  { id: "honor", name: "Honor", desc: "ตราเกียรติยศ" },
];

export function ShareSheet({ open, onOpenChange, data }: { open: boolean; onOpenChange: (o: boolean) => void; data: ShareData | null }) {
  const [style, setStyle] = useState("minimal");
  const [blur, setBlur] = useState(false);

  if (!data) return null;

  const money = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const isWin = data.pnl > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Share {data.date}</DialogTitle>
          <p className="text-sm text-muted-foreground">{data.tradeCount} trades · Net {money(data.pnl)}</p>
        </DialogHeader>

        <div className="grid gap-4 p-5 md:grid-cols-[1fr_280px]">
          <div className="flex items-center justify-center rounded-2xl border bg-muted/40 p-6">
            <div className={cn(
              "flex aspect-square w-full max-w-[220px] flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-sm",
              isWin ? "bg-bull/5 border-bull/30" : "bg-bear/5 border-bear/30"
            )}>
              <p className="text-xs text-muted-foreground">{data.date}</p>
              <p className={cn("mt-2 font-mono text-4xl tabular-nums", isWin ? "text-bull" : "text-bear", blur && "blur-sm")}>
                {money(data.pnl)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{data.tradeCount} trades</p>
              <p className="mt-4 text-[10px] tracking-wider text-muted-foreground">TOPTIERCLUB</p>
            </div>
          </div>

          <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="show">Show</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            <TabsContent value="design" className="mt-3 space-y-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm",
                    style === s.id && "border-foreground bg-secondary"
                  )}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.desc}</span>
                </button>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">สไตล์เพิ่มเติมจากต้นฉบับจะถูกเพิ่มทีหลัง</p>
            </TabsContent>
            <TabsContent value="show" className="mt-3 space-y-3">
              <label className="flex items-center justify-between text-sm">
                <span>ซ่อนตัวเลข (blur)</span>
                <input type="checkbox" checked={blur} onChange={(e) => setBlur(e.target.checked)} />
              </label>
              <p className="text-xs text-muted-foreground">ตัวเลือก privacy อื่น ๆ จะถูกเพิ่มตามต้นฉบับ</p>
            </TabsContent>
            <TabsContent value="export" className="mt-3 space-y-2">
              <Button className="w-full" disabled>บันทึกรูป</Button>
              <Button variant="outline" className="w-full" disabled>คัดลอก</Button>
              <Button variant="outline" className="w-full" disabled>แชร์</Button>
              <p className="text-xs text-muted-foreground">Export จะเชื่อมเมื่อ preview เสถียร</p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
