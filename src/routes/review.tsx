import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPending, moderatePost } from "@/lib/community.functions";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review trades — Red Box" },
      { name: "description", content: "Approve or reject community trade submissions." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Review trades — Red Box" },
      { property: "og:description", content: "Moderation queue for community trades." },
    ],
  }),
  component: Review,
});

type Posts = Awaited<ReturnType<typeof getPending>>["posts"];

function Review() {
  const load = useServerFn(getPending);
  const moderate = useServerFn(moderatePost);
  const [pass, setPass] = useState("");
  const [posts, setPosts] = useState<Posts | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function open(e: React.FormEvent) {
    e.preventDefault();
    const r = await load({ data: { passcode: pass } });
    if (!r.ok) return setMsg(r.error);
    setMsg(null); setPosts(r.posts);
  }
  async function act(id: string, status: "approved" | "rejected") {
    const r = await moderate({ data: { passcode: pass, id, status } });
    if (r.ok) setPosts((p) => p?.filter((x) => x.id !== id) ?? null);
    else setMsg(r.error);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-16 sm:px-10 sm:pt-24">
        <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Review queue</h1>
        {!posts ? (
          <form onSubmit={open} className="mt-8 flex gap-3">
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Admin passcode"
              className="w-64 rounded-lg border bg-background px-3 py-2 outline-none focus:border-gold" />
            <button className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground">Open</button>
          </form>
        ) : posts.length === 0 ? (
          <p className="mt-8 text-muted-foreground">Nothing waiting. All caught up.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {posts.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl border bg-card">
                {p.image && <a href={p.image} target="_blank" rel="noreferrer"><img src={p.image} alt="Submitted trade chart" className="aspect-video w-full object-cover" /></a>}
                <div className="p-5">
                  <p className="font-medium">{p.author_name} <span className="font-mono text-xs text-muted-foreground">{p.direction} {p.lots} lot · {p.entry_price} → {p.exit_price} · {p.pnl >= 0 ? "+" : ""}${p.pnl}</span></p>
                  {p.note && <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => act(p.id, "approved")} className="rounded-lg bg-bull px-4 py-1.5 text-sm font-medium text-background">Approve</button>
                    <button onClick={() => act(p.id, "rejected")} className="rounded-lg border px-4 py-1.5 text-sm text-muted-foreground hover:text-bear">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {msg && <p className="mt-4 text-sm text-bear">{msg}</p>}
      </main>
    </div>
  );
}
