import type { KiwiUrl } from "../lib/kiwi-url";

interface ResultsListProps {
  urls: KiwiUrl[];
  excludedCount: number;
  maxStops: number;
  originName?: string;
  destinationName?: string;
}

export default function ResultsList({
  urls,
  excludedCount,
  maxStops,
  originName,
  destinationName,
}: ResultsListProps) {
  if (!originName || !destinationName) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-line p-12">
        <div className="text-center">
          <div className="mb-3 text-3xl opacity-30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto text-ink-muted">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <p className="text-sm text-ink-muted">
            Select an origin and destination<br />to see search links
          </p>
        </div>
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-line p-12">
        <p className="text-center text-sm text-ink-muted">
          No dates in the selected range
        </p>
      </div>
    );
  }

  return (
    <div className="lg:overflow-y-auto lg:pr-1">
      <div className="mb-4 sticky top-0 z-10 bg-parchment pb-2">
        <h2 className="font-serif text-xl text-ink">
          {originName} &rarr; {destinationName}
        </h2>
        <p className="kicker mt-1">
          {urls.length} search{urls.length !== 1 ? "es" : ""} &middot;{" "}
          {maxStops} stop{maxStops !== 1 ? "s" : ""} max &middot;{" "}
          {excludedCount} excluded
        </p>
      </div>

      <div className="space-y-2">
        {urls.map((u) => (
          <a
            key={u.date}
            href={u.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-surface group flex items-center justify-between rounded-xl px-4 py-3.5 transition-all hover:-translate-y-0.5"
          >
            <div>
              <span className="text-sm font-semibold text-ink">
                {u.prettyDate}
              </span>
              <span className="ml-2 kicker">{u.dayOfWeek}</span>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-ink-muted transition-colors group-hover:text-accent"
            >
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
