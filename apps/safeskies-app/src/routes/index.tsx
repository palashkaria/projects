import { createFileRoute } from "@tanstack/react-router";
import { useSearchState } from "../hooks/useSearchState";
import SearchForm from "../components/SearchForm";
import ResultsList from "../components/ResultsList";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const state = useSearchState();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Nav */}
      <header className="border-b border-line bg-surface-strong/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-ink font-mono text-[10px] font-medium text-parchment-light">
              SS
            </div>
            <span className="text-[13px] font-semibold tracking-[0.08em] text-ink uppercase">
              SafeSkies
            </span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[12px] text-ink-soft">
              Fly safe. Skip conflict zones.
            </span>
          </div>
        </div>
      </header>

      {/* Search Interface */}
      <main className="rise-in mx-auto flex-1 grid w-full max-w-6xl grid-cols-1 gap-6 px-6 py-4 lg:grid-cols-[minmax(0,400px)_1fr] min-h-0" style={{ animationDelay: "120ms" }}>
        <SearchForm
          origin={state.origin}
          destination={state.destination}
          setOrigin={state.setOrigin}
          setDestination={state.setDestination}
          startDate={state.startDate}
          endDate={state.endDate}
          setDateRange={state.setDateRange}
          maxStops={state.maxStops}
          setMaxStops={state.setMaxStops}
          avoidConflictZones={state.avoidConflictZones}
          avoidMiddleEast={state.avoidMiddleEast}
          toggleConflictZones={state.toggleConflictZones}
          toggleMiddleEast={state.toggleMiddleEast}
          excludedCountries={state.excludedCountries}
          toggleCountry={state.toggleCountry}
          toggleRegion={state.toggleRegion}
        />
        <ResultsList
          urls={state.generatedUrls}
          excludedCount={state.excludedCountries.size}
          maxStops={state.maxStops}
          originName={state.origin?.city}
          destinationName={state.destination?.city}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <span className="kicker">SafeSkies</span>
        </div>
      </footer>
    </div>
  );
}
