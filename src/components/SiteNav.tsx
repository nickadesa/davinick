import { Link, useRouterState } from "@tanstack/react-router";
import { ChartCandlestick, ChevronDown, Menu, Moon, Newspaper, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const pages = [
  { to: "/", label: "Signals & news", icon: Newspaper },
  { to: "/desk", label: "Chart", icon: ChartCandlestick },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function SiteNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setDark(saved !== "light");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="glass sticky top-0 z-40 w-full border-b">
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-10">
        <Link to="/" aria-label="TOPTIERclub home" className="shrink-0 text-xl font-bold sm:text-2xl">TOPTIER<span className="font-normal text-muted-foreground">club</span></Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 border border-border" aria-label="Open navigation menu">
              <Menu />
              <span className="hidden sm:inline">Menu</span>
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={12} className="w-56 p-2">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">TOPTIERclub</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pages.map(({ to, label, icon: Icon }) => (
              <DropdownMenuItem key={to} asChild className="p-3">
                <Link to={to} aria-current={pathname === to ? "page" : undefined} className={pathname === to ? "bg-accent" : ""}>
                  <Icon className="mr-2 h-4 w-4" /><span>{label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleTheme} className="p-3 cursor-pointer">
              {dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              <span>{dark ? "Light mode" : "Dark mode"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
