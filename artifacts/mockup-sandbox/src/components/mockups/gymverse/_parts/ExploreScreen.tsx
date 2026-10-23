import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { FeedTab } from "./data";
import { CATEGORIES, TRENDS } from "./data";
import { PageHeader } from "./ui";

export function ExploreScreen({ onOpenFeed }: { onOpenFeed: (tab: FeedTab, label: string) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CATEGORIES.filter((c) => `${c.name} ${c.desc}`.toLowerCase().includes(q)) : CATEGORIES;
  }, [query]);
  const filtering = query.trim().length > 0;

  return (
    <div className="gv-page">
      <PageHeader kicker="Find your lane" title="Explore" />

      <label className="gv-search">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lanes, lifts, goals" aria-label="Search categories" />
        {query && (
          <button type="button" className="gv-search-clear" aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button>
        )}
      </label>

      {!filtering && (
        <div className="gv-trends" aria-label="Trending hashtags">
          {TRENDS.map((trend) => (
            <button key={trend.tag} type="button" className="gv-trend" onClick={() => onOpenFeed(trend.tab, trend.tag)}>
              <span><i>#</i>{trend.tag.slice(1)}</span>
              <small>{trend.count}</small>
            </button>
          ))}
        </div>
      )}

      <div className="gv-section-label">
        <span className="gv-label">{filtering ? `${results.length} ${results.length === 1 ? "lane" : "lanes"} found` : "All fitness. All the time."}</span>
        {!filtering && <span className="gv-label is-accent">10 lanes</span>}
      </div>

      {results.length ? (
        <div className="gv-mosaic">
          {results.map(({ name, desc, count, icon: Icon, tab, tone, size }) => (
            <button
              key={name}
              type="button"
              className={`gv-tile gv-tone-${tone} is-${filtering ? "base" : size}`}
              onClick={() => onOpenFeed(tab, name)}
            >
              <Icon className="gv-tile-mark" strokeWidth={1.4} />
              <span className="gv-tile-icon"><Icon size={18} /></span>
              <ArrowUpRight className="gv-tile-go" size={18} />
              <span className="gv-tile-name">{name}</span>
              <span className="gv-tile-desc">{desc}</span>
              <span className="gv-tile-count"><i />{count}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="gv-empty-note">No lanes match “{query}”. Try “strength” or “beginner”.</p>
      )}
    </div>
  );
}
