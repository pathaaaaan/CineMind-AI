import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

type Props = {
  onSearch: (query: string) => void;
  loading?: boolean;
};

export function SearchBox({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("I want a mind-bending sci-fi movie with emotional storytelling.");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-muted p-4 shadow-sm">
      <Textarea value={query} onChange={(event) => setQuery(event.target.value)} maxLength={500} />
      <div className="mt-3 flex justify-end">
        <Button disabled={loading}>
          <Search size={16} />
          {loading ? "Searching" : "Search"}
        </Button>
      </div>
    </form>
  );
}

