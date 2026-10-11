import { Link, useRouterState } from "@tanstack/react-router";
import { ChartCandlestick, ChevronDown, History, Menu, Newspaper, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const pages = [
  { to: "/", label: "Signals & news", icon: Newspaper },
  { to: "/desk", label: "Gold signal desk", icon: ChartCandlestick },
  { to: "/history", label: "Performance history", icon: History },
] as const;

export function SiteNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <header className="glass sticky top-0 z-40 w-full border-b">
      <nav aria-label="Main navigation" className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-3 px-5 sm:px-10">
        <Link to="/" aria-label="TOPTIERclub home" className="shrink-0 text-xl font-bold sm:text-2xl">TOPTIER<span className="font-normal text-muted-foreground">club</span></Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-bull animate-pulse-dot" /> XAUUSD desk</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 border border-border" aria-label="Open navigation menu"><Menu /><span>Menu</span><ChevronDown /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={12} className="w-64 max-w-[calc(100vw-2.5rem)] p-2">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">TOPTIERclub · XAUUSD</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {pages.map(({ to, label, icon: Icon }) => (
                <DropdownMenuItem key={to} asChild className="p-3">
                  <Link to={to} aria-current={pathname === to ? "page" : undefined} className={pathname === to ? "bg-accent text-accent-foreground" : "text-muted-foreground"}><Icon /><span>{label}</span>{pathname === to && <Zap className="ml-auto text-bull" />}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
