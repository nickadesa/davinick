import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, BookOpen, CalendarDays, ChartCandlestick, Menu, Moon, Newspaper, PanelLeftClose, PanelLeftOpen, Settings, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/hooks/use-theme";
import { getAiAnalysis, getCalendar } from "@/lib/market.functions";
import { cn } from "@/lib/utils";

const pages = [
  { to: "/", label: "Signals and news", icon: Newspaper },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/desk", label: "Desk", icon: ChartCandlestick },
  { to: "/journal", label: "Journal", icon: BookOpen },
] as const;

const COLLAPSE_KEY = "toptier-sidebar-collapsed";
const SEEN_KEY = "toptier-notif-seen";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useShellData() {
  const cal = useQuery({ queryKey: ["calendar"], queryFn: () => getCalendar(), staleTime: 60_000 });
  const ai = useQuery({ queryKey: ["ai-analysis"], queryFn: () => getAiAnalysis({ data: {} }), staleTime: 60_000 });
  return { events: cal.data?.events ?? [], generatedAt: ai.data?.analysis?.generatedAt ?? null };
}

function CompactNext({ now }: { now: Date | null }) {
  const { events } = useShellData();
  const next = now ? events.find((e) => new Date(e.time) > now) : undefined;
  const diff = next && now ? new Date(next.time).getTime() - now.getTime() : null;
  const h = diff === null ? 0 : Math.floor(diff / 3600e3);
  const m = diff === null ? 0 : Math.floor((diff % 3600e3) / 60e3);
  const fill = diff === null ? 0 : Math.min(100, Math.max(0, (1 - diff / (24 * 3600e3)) * 100));
  const soon = diff !== null && diff <= 3600e3;
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("size-1.5 rounded-full", soon ? "animate-pulse-dot bg-brand" : "bg-muted-foreground/50")} aria-hidden />
        Next release
      </div>
      <p className="mt-2 line-clamp-1 text-sm">{next?.title ?? (now && events.length ? "None left this week" : "Loading")}</p>
      <p className="mt-1 font-mono text-lg tabular-nums">{next ? `${h}h ${String(m).padStart(2, "0")}m` : "—"}</p>
      <Progress value={fill} className="mt-2 h-1" aria-label="Time to release, last 24 hours" />
    </div>
  );
}

function SidebarBody({ collapsed, onNavigate, now }: { collapsed: boolean; onNavigate?: () => void; now: Date | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { dark, toggle } = useTheme();
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <Link to="/" onClick={onNavigate} aria-label="TOPTIERclub home" className={cn("flex h-10 items-center px-2 text-lg font-medium", collapsed && "justify-center px-0")}>
        {collapsed ? "T" : <>TOPTIER<span className="font-normal text-muted-foreground">club</span></>}
      </Link>
      <nav aria-label="Main navigation" className="flex flex-col gap-1">
        {pages.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link key={to} to={to} onClick={onNavigate} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined}
              className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-faint", active ? "bg-secondary text-foreground" : "text-muted-foreground", collapsed && "justify-center px-0")}>
              <Icon className="size-4 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        {!collapsed && <CompactNext now={now} />}
        {!collapsed && <p className="px-1 text-xs leading-relaxed text-muted-foreground">Educational only, not financial advice.</p>}
        <button onClick={toggle} title={dark ? "Light mode" : "Dark mode"} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-faint", collapsed && "justify-center px-0")}>
          {dark ? <Sun className="size-4" strokeWidth={1.5} /> : <Moon className="size-4" strokeWidth={1.5} />}
          {!collapsed && (dark ? "Light mode" : "Dark mode")}
        </button>
      </div>
    </div>
  );
}

function Notifications({ now }: { now: Date | null }) {
  const { events, generatedAt } = useShellData();
  const [seen, setSeen] = useState<string | null>(null);
  useEffect(() => setSeen(localStorage.getItem(SEEN_KEY)), []);
  const soon = now ? events.filter((e) => { const d = new Date(e.time).getTime() - now.getTime(); return d > 0 && d <= 3600e3; }) : [];
  const items = [
    ...soon.map((e) => ({ key: e.id ?? e.time + e.title, title: `${e.title} in ${Math.max(1, Math.round((new Date(e.time).getTime() - now!.getTime()) / 60e3))} min`, body: "High-impact USD release", at: e.time })),
    ...(generatedAt ? [{ key: "ai-" + generatedAt, title: "New AI desk analysis", body: new Date(generatedAt).toLocaleString("en-GB", { timeZone: "America/New_York", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) + " New York", at: generatedAt }] : []),
  ];
  const unread = items.filter((i) => !seen || new Date(i.at).getTime() > new Date(seen).getTime() || i.key.startsWith("ai-") === false).length;
  return (
    <Popover onOpenChange={(o) => { if (!o) { const v = new Date().toISOString(); localStorage.setItem(SEEN_KEY, v); setSeen(v); } }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} new` : ""}`} className="relative">
          <Bell strokeWidth={1.5} />
          {unread > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-brand" aria-hidden />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b px-4 py-3 text-sm font-medium">Notifications</p>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Nothing new. Red news due within 60 minutes and new AI analysis show here</p>
        ) : (
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.key} className="px-4 py-3">
                <p className="text-sm">{i.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{i.body}</p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Profile"><User strokeWidth={1.5} /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild><Link to="/profile"><User className="mr-2 size-4" />Profile</Link></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpen(true)}><Settings className="mr-2 size-4" />Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Saved in this browser.</DialogDescription>
          </DialogHeader>
          <label className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
            Dark mode <Switch checked={dark} onCheckedChange={toggle} />
          </label>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const now = useNow();
  useEffect(() => setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"), []);
  function toggleCollapse() {
    setCollapsed((c) => { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); return !c; });
  }
  return (
    <div className="min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r bg-background transition-[width] duration-200 md:block", collapsed ? "w-[60px]" : "w-[260px]")}>
        <SidebarBody collapsed={collapsed} now={now} />
      </aside>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody collapsed={false} now={now} onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>
      <div className={cn("transition-[padding] duration-200", collapsed ? "md:pl-[60px]" : "md:pl-[260px]")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu strokeWidth={1.5} /></Button>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggleCollapse}>
            {collapsed ? <PanelLeftOpen strokeWidth={1.5} /> : <PanelLeftClose strokeWidth={1.5} />}
          </Button>
          <Link to="/" className="text-base font-medium md:hidden">TOPTIER<span className="font-normal text-muted-foreground">club</span></Link>
          <div className="ml-auto flex items-center gap-1">
            <Notifications now={now} />
            <ProfileMenu />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
