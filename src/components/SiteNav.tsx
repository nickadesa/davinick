import { Link } from "@tanstack/react-router";

export function SiteNav() {
  const item = "text-muted-foreground transition-colors hover:text-foreground";
  return (
    <nav className="glass sticky top-3 z-20 mx-auto mt-3 flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-4 overflow-x-auto rounded-full border px-4 py-2 text-xs sm:top-4 sm:mt-4 sm:gap-8 sm:px-5 sm:py-2.5 sm:text-sm">
      <Link to="/" className="font-bold tracking-tight">RED<span className="text-muted-foreground">BOX</span></Link>
      <Link to="/" hash="signals" className={`hidden sm:inline ${item}`}>Signals</Link>
      <Link to="/" hash="news" className={`hidden sm:inline ${item}`}>News</Link>
      <Link to="/desk" className={item} activeProps={{ className: "text-foreground" }}>Desk</Link>
      <Link to="/community" className={item} activeProps={{ className: "text-foreground" }}>Community</Link>
      <Link to="/history" className={item} activeProps={{ className: "text-foreground" }}>History</Link>
      <span className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground">
        <span className="size-1.5 rounded-full bg-bull animate-pulse-dot" /> Live
      </span>
    </nav>
  );
}
