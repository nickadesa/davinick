import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Profile — TOPTIERclub" }],
  }),
  component: Profile,
});

function Profile() {
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else if (mode === "signup") setMessage("Check your email to confirm your account.");
    else setMessage(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-lg px-5 py-12">
        {user ? (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <span className="text-3xl">👤</span>
            </div>
            <h1 className="mt-6 text-2xl font-bold">{user.email}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Signed in</p>
            <button onClick={signOut} className="mt-6 rounded-full border px-5 py-2 text-sm hover:bg-accent">
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? "Welcome back." : "Join TOPTIERclub."}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-gold"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gold py-3 font-medium text-black disabled:opacity-50"
              >
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
              </button>
            </form>

            {message && <p className="mt-4 text-sm text-bear">{message}</p>}

            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        )}

        <div className="mt-12 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">{dark ? "Dark" : "Light"}</p>
            </div>
            <button
              onClick={toggleTheme}
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
