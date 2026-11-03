import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getCalendar } from "@/lib/market.functions";
import { NewsList } from "@/components/NewsRow";

const calendarQuery = queryOptions({ queryKey: ["calendar"], queryFn: () => getCalendar(), staleTime: 60_000 });

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Red-news calendar — TOPTIERclub" },
      { name: "description", content: "This week's high-impact USD releases in New York time, with forecast, actual and gold bias." },
      { property: "og:title", content: "Red-news calendar — TOPTIERclub" },
      { property: "og:description", content: "High-impact USD releases this week and how each one scores for gold." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(calendarQuery),
  errorComponent: () => <div className="p-20 text-center text-muted-foreground">The calendar couldn't load. Try again shortly</div>,
  component: CalendarPage,
});

function CalendarPage() {
  const { data } = useSuspenseQuery(calendarQuery);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-10">
        <section className="animate-blur-in pt-12 pb-8 sm:pt-20">
          <h1 className="text-4xl font-medium tracking-[-0.02em] sm:text-6xl">This week's red news</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">High-impact USD releases, New York time. Tap a released event to see why it moves gold</p>
        </section>
        {data.error && <p className="mb-4 text-sm text-bear">{data.error}</p>}
        <NewsList events={data.events} now={now} />
      </main>
    </div>
  );
}
