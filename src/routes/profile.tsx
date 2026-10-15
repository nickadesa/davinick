import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Profile — TOPTIERclub" }],
  }),
  component: Profile,
});

function Profile() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-lg px-5 py-16">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold">Profile</h1>
          <p className="mt-2 text-muted-foreground">User system coming next</p>
        </div>

        <div className="mt-12 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">{dark ? "Dark" : "Light"}</p>
            </div>
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-accent"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
