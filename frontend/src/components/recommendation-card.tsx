import { Brain, ListChecks } from "lucide-react";

import type { Recommendation } from "../types/api";
import { MovieCard } from "./movie-card";

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-zinc-900 p-4 shadow-sm lg:grid-cols-[1fr_1.1fr]">
      <MovieCard movie={recommendation.movie} />
      <section className="rounded-md bg-muted p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Brain size={16} />
          AI explanation
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{recommendation.explanation.why_recommended}</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <FactList title="Themes" items={recommendation.explanation.similar_themes} />
          <FactList title="Genres" items={recommendation.explanation.similar_genres} />
          <FactList title="Story" items={recommendation.explanation.storytelling_elements} />
        </div>
      </section>
    </div>
  );
}

function FactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1 font-medium">
        <ListChecks size={14} />
        {title}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.length ? items.map((item) => <span key={item} className="rounded-sm bg-zinc-800 px-2 py-1 text-xs">{item}</span>) : <span className="text-xs text-muted-foreground">Context matched</span>}
      </div>
    </div>
  );
}

