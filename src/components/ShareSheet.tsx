import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ShareData = { date: string; pnl: number; tradeCount: number };

const GROUPS = [
  { id: "minimal", name: "Minimal", desc: "ตัวเลขใหญ่ อ่านง่าย" },
  { id: "chart", name: "Chart", desc: "มีกราฟเล็ก" },
  { id: "exchange", name: "Exchange", desc: "สไตล์แอปเทรด" },
  { id: "honor", name: "Honor", desc: "ตราเกียรติยศ" },
  { id: "premium", name: "Premium", desc: "พื้นผิวโลหะ / หนัง" },
  { id: "pattern", name: "Pattern", desc: "ลายเต็มรูป" },
];

const THEMES = [
  { id: "auto", name: "Auto" },
  { id: "midnight", name: "Midnight", bg: "from-[#0B1020] to-[#1B2650]", accent: "#7C9CFF" },
  { id: "gold", name: "Gold", bg: "from-[#0E0E10] to-[#0E0E10]", accent: "#D8B65C" },
  { id: "emerald", name: "Emerald", bg: "from-[#052E26] to-[#0B6B54]", accent: "#6EE7B7" },
  { id: "mono", name: "Mono", bg: "bg-black", accent: "#FFFFFF" },
];

export function ShareSheet({ open, onOpenChange, data }: { open: boolean; onOpenChange: (o: boolean) => void; data: ShareData | null }) {
  const [group, setGroup] = useState("minimal");
  const [theme, setTheme] = useState("auto");
  const [blur, setBlur] = useState(false);
  const [showUsername, setShowUsername] = useState(true);
  const [showReturn, setShowReturn] = useState(true);

  if (!data) return null;

  const money = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const isWin = data.pnl > 0;
  const themeObj = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Share {data.date}</DialogTitle>
          <p className="text-sm text-muted-foreground">{data.tradeCount} trades · Net {money(data.pnl)}</p>
        </DialogHeader>

        <div className="grid max-h-[calc(90vh-80px)] gap-0 overflow-auto md:grid-cols-[1fr_300px]">
          <div className="flex items-center justify-center bg-muted/30 p-6">
            <div className={cn(
              "flex aspect-square w-full max-w-[260px] flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-lg",
              theme === "auto"
                ? isWin ? "bg-bull/5 border-bull/30" : "bg-bear/5 border-bear/30"
                : `bg-gradient-to-br ${themeObj.bg} text-white border-white/10`
            )}>
              <p className="text-xs opacity-70">{data.date}</p>
              <p className={cn("mt-3 font-mono text-4xl tabular-nums", blur && "blur-md select-none")}>
                {money(data.pnl)}
              </p>
              {showReturn && <p className="mt-1 text-sm opacity-80">{isWin ? "Profit" : "Loss"}</p>}
              <p className="mt-3 text-xs opacity-60">{data.tradeCount} trades</p>
              {showUsername && <p className="mt-4 text-[10px] tracking-widest opacity-50">@toptier_trader</p>}
              <p className="mt-1 text-[10px] tracking-wider opacity-40">TOPTIERCLUB</p>
            </div>
          </div>

          <div className="border-l p-4">
            <Tabs defaultValue="design">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="show">Show</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">กลุ่มสไตล์</p>
                  <div className="space-y-1">
                    {GROUPS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGroup(g.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                          group === g.id ? "bg-secondary font-medium" : "hover:bg-faint"
                        )}
                      >
                        <span>{g.name}</span>
                        <span className="text-xs text-muted-foreground">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">ธีม</p>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs",
                          theme === t.id && "border-foreground bg-secondary"
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">สไตล์เต็มรูปแบบและลายจากต้นฉบับจะถูกเพิ่มทีละกลุ่ม</p>
              </TabsContent>

              <TabsContent value="show" className="mt-4 space-y-3">
                <label className="flex items-center justify-between text-sm">
                  <span>ซ่อนตัวเลข (blur)</span>
                  <input type="checkbox" checked={blur} onChange={(e) => setBlur(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>แสดงชื่อบัญชี</span>
                  <input type="checkbox" checked={showUsername} onChange={(e) => setShowUsername(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>แสดงสถานะ Profit/Loss</span>
                  <input type="checkbox" checked={showReturn} onChange={(e) => setShowReturn(e.target.checked)} />
                </label>
                <p className="text-xs text-muted-foreground">ตัวเลือก mask หลัก, avatar, โลโก้เว็บ จะถูกเพิ่มตามต้นฉบับ</p>
              </TabsContent>

              <TabsContent value="export" className="mt-4 space-y-2">
                <Button className="w-full" disabled>บันทึกรูป</Button>
                <Button variant="outline" className="w-full" disabled>คัดลอก</Button>
                <Button variant="outline" className="w-full" disabled>แชร์</Button>
                <p className="text-xs text-muted-foreground">Export จะเปิดใช้งานเมื่อ preview วาดด้วย canvas เสถียร</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
