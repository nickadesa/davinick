import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Red Box" },
      { name: "description", content: "Sign in to share your gold trades with the Red Box community." },
      { property: "og:title", content: "Sign in — Red Box" },
      { property: "og:description", content: "Join the Red Box trading community." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/community" }); }, [user, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/community`, data: { full_name: name.trim() } },
      });
      setMsg(error ? error.message : data.session ? null : "Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (r.error) setMsg("Google sign-in failed. Try again.");
  }

  const field = "w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-gold";
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-sm px-6 pt-24">
        <h1 className="text-4xl font-bold tracking-[-0.03em]">{mode === "in" ? "Welcome back." : "Join the desk."}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Sign in to post your gold trades to the community.</p>
        <button onClick={google} className="mt-8 w-full rounded-lg border py-2.5 font-medium transition-colors hover:border-gold/40">Continue with Google</button>
        <p className="my-6 text-center font-mono text-xs text-muted-foreground">OR</p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && <input required maxLength={40} className={field} placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />}
          <input required type="email" className={field} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" minLength={6} className={field} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50">
            {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        {msg && <p className="mt-4 text-sm text-muted-foreground">{msg}</p>}
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
        </button>
      </main>
    </div>
  );
}
