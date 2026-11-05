import { createFileRoute } from "@tanstack/react-router";
import { Index } from "./index";
export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [
    { title: "News analysis — TOPTIERclub" },
    { name: "description", content: "Gold news analysis, pre-release calls and what-if scenarios." },
    { property: "og:title", content: "News analysis — TOPTIERclub" },
    { property: "og:description", content: "Gold news analysis and confidence-scored pre-release scenarios." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});