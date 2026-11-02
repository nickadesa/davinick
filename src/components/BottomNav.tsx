import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ChartCandlestick, History, Home, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/history", label: "History", icon: History },
  { to: "/desk", label: "Desk", icon: ChartCandlestick },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Tabs" className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background sm:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${active ? "text-gold" : "text-muted-foreground"}`}>
              <Icon className="size-5" strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
