import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, CalendarDays, ChevronDown, Menu, PanelLeftClose, PanelLeftOpen, Search, Home, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TopTierLogo } from "./TopTierLogo";

const COLLAPSE_KEY = "toptier-sidebar-collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"), []);
  function toggleCollapse() {
    setCollapsed((c) => { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); return !c; });
  }

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-[#0c0c0e] text-white">
      <div className={cn("flex items-center gap-2 border-b border-white/10 px-3 py-3", collapsed && "justify-center")}>
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2">
          {collapsed ? <span className="text-lg font-semibold">T</span> : <><TopTierLogo className="h-5 w-auto text-white" /><span className="text-sm font-medium">TOPTIER</span></>}
        </Link>
      </div>
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-4" />
            <span>Search</span>
          </div>
        </div>
      )}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        <Link to="/" onClick={onNavigate} className={cn("flex h-10 items-center gap-2 rounded-lg px-3 text-sm", pathname === "/" ? "bg-white/10" : "hover:bg-white/5", collapsed && "justify-center")}>
          <Home className="size-4" />
          {!collapsed && "Home"}
        </Link>
        <Link to="/calendar" onClick={onNavigate} className={cn("flex h-10 items-center gap-2 rounded-lg px-3 text-sm", pathname.startsWith("/calendar") ? "bg-white/10" : "hover:bg-white/5", collapsed && "justify-center")}>
          <CalendarDays className="size-4" />
          {!collapsed && "Calendar"}
        </Link>
        <Link to="/journal" onClick={onNavigate} className={cn("flex h-10 items-center gap-2 rounded-lg px-3 text-sm", pathname.startsWith("/journal") ? "bg-white/10" : "hover:bg-white/5", collapsed && "justify-center")}>
          <BookOpen className="size-4" />
          {!collapsed && "Journal"}
        </Link>
      </nav>
      <div className="mt-auto border-t border-white/10 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5", collapsed && "justify-center")}>
              <div className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs">D</div>
              {!collapsed && <div className="min-w-0"><p className="truncate text-sm">DAVINICK</p><p className="truncate text-xs text-muted-foreground">nickadesa</p></div>}
              {!collapsed && <ChevronDown className="size-4" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 transition-[width] duration-200 md:block", collapsed ? "w-[60px]" : "w-[260px]")}>
        <Sidebar />
      </aside>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>
      <div className={cn("transition-[padding] duration-200", collapsed ? "md:pl-[60px]" : "md:pl-[260px]")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setDrawer(true)}><Menu className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={toggleCollapse}>
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
          <Link to="/" className="md:hidden"><TopTierLogo className="h-5 w-auto" /></Link>
        </header>
        {children}
      </div>
    </div>
  );
}
