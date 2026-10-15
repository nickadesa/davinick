import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LineChart, Zap, User } from "lucide-react";

const tabs = [
  { to: "/", label: "หน้าหลัก", icon: Home },
  { to: "/desk", label: "กราฟ", icon: LineChart },
  { to: "/", label: "สัญญาณ", icon: Zap, hash: "signals" },
  { to: "/profile", label: "โปรไฟล์", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur sm:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {tabs.map(({ to, label, icon: Icon, hash }) => {
          const active = pathname === to || (hash && pathname === "/");
          return (
            <Link
              key={label}
              to={to}
              hash={hash}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                active ? "text-gold" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
