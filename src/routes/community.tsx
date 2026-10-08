import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCommunity } from "@/lib/community.functions";
import { tradePnl } from "@/lib/signals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteNav } from "@/components/SiteNav";

const communityQuery = queryOptions({ queryKey: ["community"], queryFn: () => getCommunity(), staleTime: 60_000 });

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community trades — Red Box" },
      { name: "description", content: "Real gold trades shared by Red Box members, with screenshots and a leaderboard." },
      { property: "og:title", content: "Community trades — Red Box" },
      { property: "og:description", content: "See how members traded the gold signals." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(communityQuery),
  errorComponent: () => <div className="p-20 text-center text-muted-foreground">The community feed couldn't load. Try again shortly.</div>,
  notFoundComponent: () => <div className="p-20 text-center text-muted-foreground">Not found</div>,
  component: Community,
});

const money = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;

function Community() {
  const { data } = useSuspenseQuery(communityQuery);
  const total = data.posts.reduce((a, p) => a + p.pnl, 0);
  const wins = data.posts.filter((p) => p.pnl > 0).length;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-10 pb-24">
        <section className="pt-24 pb-12">
          <h1 className="animate-blur-in text-6xl font-bold tracking-[-0.04em]">Community.<br /><span className="text-muted-foreground">Proof, not promises.</span></h1>
          <p className="mt-6 max-w-lg text-muted-foreground">Members share the gold trades they took from the signals. Every post is checked before it goes live.</p>
        </section>

        <div className="grid grid-cols-3 gap-5">
          <Big k="Shared trades" v={String(data.posts.length)} />
          <Big k="Win rate" v={data.posts.length ? `${Math.round((wins / data.posts.length) * 100)}%` : "—"} />
          <Big k="Combined result" v={data.posts.length ? money(total) : "—"} tone={total >= 0 ? "text-bull" : "text-bear"} />
        </div>

        <ShareForm />

        <div className="mt-16 grid grid-cols-[1fr_320px] gap-8">
          <section>
            <h2 className="mb-6 text-3xl font-bold tracking-[-0.03em]">Latest trades</h2>
            {data.error && <p className="text-sm text-bear">{data.error}</p>}
            {data.posts.length === 0 && <p className="rounded-2xl border px-6 py-14 text-center text-sm text-muted-foreground">No approved trades yet. Be the first to share one.</p>}
            <div className="grid grid-cols-2 gap-5">
              {data.posts.map((p) => (
                <article key={p.id} className="overflow-hidden rounded-2xl border bg-card">
                  {p.image && <a href={p.image} target="_blank" rel="noreferrer"><img src={p.image} alt={`${p.author_name}'s gold trade chart`} className="aspect-video w-full object-cover" loading="lazy" /></a>}
                  <div className="p-5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{p.author_name}</span>
                      <span className={`font-mono text-lg ${p.pnl >= 0 ? "text-bull" : "text-bear"}`}>{money(p.pnl)}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      <span className={p.direction === "BUY" ? "text-bull" : "text-bear"}>{p.direction}</span> {p.lots} lot · {p.entry_price} → {p.exit_price}
                    </p>
                    {p.note && <p className="mt-3 text-sm text-muted-foreground">{p.note}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <aside>
            <h2 className="mb-6 text-3xl font-bold tracking-[-0.03em]">Leaderboard</h2>
            <div className="divide-y rounded-2xl border">
              {data.leaders.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">Empty for now.</p>}
              {data.leaders.map((l, i) => (
                <div key={l.name + i} className="flex items-center gap-4 px-5 py-4">
                  <span className={`font-mono text-sm ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="font-medium">{l.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{l.trades} trades · {l.rate}% wins</p>
                  </div>
                  <span className={`font-mono text-sm ${l.pnl >= 0 ? "text-bull" : "text-bear"}`}>{money(l.pnl)}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
        <p className="mt-16 border-t pt-8 text-xs text-muted-foreground">Results are self-reported by members and reviewed for obvious errors. Not financial advice.</p>
      </main>
    </div>
  );
}

function Big({ k, v, tone = "" }: { k: string; v: string; tone?: string }) {
  return (
    <div className="rounded-3xl border bg-card p-8">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{k}</p>
      <p className={`mt-4 font-mono text-5xl ${tone}`}>{v}</p>
    </div>
  );
}

function ShareForm() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const [dir, setDir] = useState<"BUY" | "SELL">("BUY");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [lots, setLots] = useState("0.10");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mine = useQuery({
    queryKey: ["my-trades", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("trade_posts").select("id, direction, entry_price, exit_price, status, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mt-8 flex items-center justify-between rounded-2xl border bg-card px-8 py-6">
        <p className="text-muted-foreground">Took a trade from a signal? Share it with the community.</p>
        <Link to="/auth" className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground">Sign in to share</Link>
      </div>
    );
  }

  const e = Number(entry), x = Number(exit), l = Number(lots);
  const valid = e > 0 && x > 0 && l > 0 && l <= 100 && !!file;
  const preview = e > 0 && x > 0 && l > 0 ? tradePnl(dir, e, x, l) : null;

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!valid || !file || !user) return setMsg("Fill in prices, lot size and add a screenshot.");
    if (!file.type.startsWith("image/")) return setMsg("Screenshot must be an image.");
    setBusy(true); setMsg(null);
    const path = `${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase() || "png"}`;
    const up = await supabase.storage.from("trade-screenshots").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setMsg("Upload failed. Images up to 5 MB."); }
    const name = (user.user_metadata?.full_name as string | undefined)?.trim() || user.email?.split("@")[0] || "Trader";
    const { error } = await supabase.from("trade_posts").insert({
      user_id: user.id, author_name: name.slice(0, 40), direction: dir, entry_price: e, exit_price: x, lots: l, note: note.slice(0, 280), screenshot_path: path,
    });
    setBusy(false);
    if (error) return setMsg("Couldn't submit. Try again.");
    setEntry(""); setExit(""); setNote(""); setFile(null);
    setMsg("Submitted — it'll appear once it's approved.");
    qc.invalidateQueries({ queryKey: ["my-trades"] });
  }

  const field = "mt-2 w-full rounded-lg border bg-background px-3 py-2 font-mono outline-none focus:border-gold";
  return (
    <div className="mt-8 rounded-3xl border bg-card p-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">Share a trade</h2>
        <button onClick={() => supabase.auth.signOut()} className="text-xs text-muted-foreground hover:text-foreground">Sign out</button>
      </div>
      <form onSubmit={submit} className="mt-6 grid grid-cols-5 items-end gap-4 text-sm">
        <div>
          <span>Direction</span>
          <div className="mt-2 flex gap-1 rounded-lg border p-1">
            {(["BUY", "SELL"] as const).map((d) => (
              <button type="button" key={d} onClick={() => setDir(d)}
                className={`flex-1 rounded-md py-1 font-mono ${dir === d ? (d === "BUY" ? "bg-bull text-background" : "bg-bear text-background") : "text-muted-foreground"}`}>{d}</button>
            ))}
          </div>
        </div>
        <label>Entry<input className={field} value={entry} onChange={(v) => setEntry(v.target.value)} inputMode="decimal" placeholder="4120.50" /></label>
        <label>Exit<input className={field} value={exit} onChange={(v) => setExit(v.target.value)} inputMode="decimal" placeholder="4135.00" /></label>
        <label>Lots<input className={field} value={lots} onChange={(v) => setLots(v.target.value)} inputMode="decimal" /></label>
        <label>Screenshot<input type="file" accept="image/*" onChange={(v) => setFile(v.target.files?.[0] ?? null)} className="mt-2 w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-foreground" /></label>
        <label className="col-span-4">Note (optional)<input className={field} maxLength={280} value={note} onChange={(v) => setNote(v.target.value)} placeholder="Bought the 61.8% after soft CPI" /></label>
        <button disabled={busy} className="rounded-lg bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50">{busy ? "Sending…" : "Submit"}</button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-muted-foreground">{msg}</span>
        {preview !== null && <span className={`font-mono ${preview >= 0 ? "text-bull" : "text-bear"}`}>Result {money(preview)}</span>}
      </div>
      {mine.data && mine.data.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Your submissions</p>
          {mine.data.map((m) => (
            <p key={m.id} className="mt-2 flex justify-between font-mono text-xs">
              <span>{m.direction} {Number(m.entry_price)} → {Number(m.exit_price)}</span>
              <span className={m.status === "approved" ? "text-bull" : m.status === "rejected" ? "text-bear" : "text-muted-foreground"}>{m.status}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
