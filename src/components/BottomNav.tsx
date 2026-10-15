import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LineChart, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Home },
  { to: "/desk", icon: LineChart },
  { to: "/profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur sm:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-4">
        {tabs.map(({ to, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center justify-center rounded-full p-3 transition-colors ${
                active ? "text-gold" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
