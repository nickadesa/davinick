import { Link } from "@tanstack/react-router";

export function SiteNav() {
  const item = "text-muted-foreground transition-colors hover:text-foreground";
  return (
    <nav className="glass sticky top-4 z-20 mx-auto mt-4 flex w-fit items-center gap-8 rounded-full border px-5 py-2.5 text-sm">
      <Link to="/" className="font-bold tracking-tight">RED<span className="text-muted-foreground">BOX</span></Link>
      <Link to="/" hash="signals" className={item}>Signals</Link>
      <Link to="/" hash="news" className={item}>News</Link>
      <Link to="/desk" className={item} activeProps={{ className: "text-foreground" }}>Desk</Link>
      <Link to="/community" className={item} activeProps={{ className: "text-foreground" }}>Community</Link>
      <Link to="/history" className={item} activeProps={{ className: "text-foreground" }}>History</Link>
      <span className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground">
        <span className="size-1.5 rounded-full bg-bull animate-pulse-dot" /> Live
      </span>
    </nav>
  );
}
