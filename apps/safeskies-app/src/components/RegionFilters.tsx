import { useState } from "react";
import { regions } from "../data/regions";
import { conflictZones } from "../data/conflict-zones";

interface RegionFiltersProps {
  excludedCountries: Set<string>;
  toggleCountry: (code: string) => void;
  toggleRegion: (regionName: string) => void;
}

export default function RegionFilters({
  excludedCountries,
  toggleCountry,
  toggleRegion,
}: RegionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="card-surface flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm text-ink-soft transition-all"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-ink-muted transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="font-medium text-ink">Country filters</span>
        <span className="kicker text-ink-muted ml-auto">
          {excludedCountries.size} excluded
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1">
          {regions.map((region) => {
            const codes = Object.keys(region.codes);
            const excludedCount = codes.filter((c) =>
              excludedCountries.has(c),
            ).length;
            const isExpanded = expandedRegion === region.name;

            return (
              <div
                key={region.name}
                className="rounded-xl border border-line bg-parchment-light/60"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleRegion(region.name)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] transition-colors ${
                      excludedCount === codes.length
                        ? "border-accent bg-accent text-parchment-light"
                        : excludedCount > 0
                          ? "border-amber-tag/40 bg-amber-tag/80 text-parchment-light"
                          : "border-line-strong bg-parchment-light"
                    }`}
                  >
                    {excludedCount === codes.length
                      ? "\u2715"
                      : excludedCount > 0
                        ? "\u2013"
                        : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRegion(isExpanded ? null : region.name)
                    }
                    className="flex flex-1 items-center justify-between text-xs"
                  >
                    <span className="font-medium text-ink">
                      {region.name}
                      {excludedCount > 0 && (
                        <span className="ml-1.5 text-ink-muted font-normal">
                          {excludedCount}/{codes.length}
                        </span>
                      )}
                    </span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-ink-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>

                {isExpanded && (
                  <div className="flex flex-wrap gap-1 px-3 pb-2.5">
                    {Object.entries(region.codes).map(([code, name]) => {
                      const isExcluded = excludedCountries.has(code);
                      const isConflict = (
                        conflictZones as readonly string[]
                      ).includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => toggleCountry(code)}
                          className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                            isExcluded
                              ? "border border-accent/20 bg-accent-soft text-accent"
                              : "border border-line bg-parchment-light text-ink-muted hover:border-line-strong hover:text-ink-soft"
                          }`}
                        >
                          {isConflict ? "\u26A0 " : ""}
                          {code} {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
