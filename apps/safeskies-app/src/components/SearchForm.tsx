import type { Airport } from "../data/airports";
import AirportAutocomplete from "./AirportAutocomplete";
import DateRangePicker from "./DateRangePicker";
import ExclusionToggles from "./ExclusionToggles";
import RegionFilters from "./RegionFilters";

interface SearchFormProps {
  origin: Airport | null;
  destination: Airport | null;
  setOrigin: (a: Airport | null) => void;
  setDestination: (a: Airport | null) => void;
  startDate: string;
  endDate: string;
  setDateRange: (start: string, end: string) => void;
  maxStops: number;
  setMaxStops: (n: number) => void;
  avoidConflictZones: boolean;
  avoidMiddleEast: boolean;
  toggleConflictZones: () => void;
  toggleMiddleEast: () => void;
  excludedCountries: Set<string>;
  toggleCountry: (code: string) => void;
  toggleRegion: (regionName: string) => void;
}

export default function SearchForm({
  origin,
  destination,
  setOrigin,
  setDestination,
  startDate,
  endDate,
  setDateRange,
  maxStops,
  setMaxStops,
  avoidConflictZones,
  avoidMiddleEast,
  toggleConflictZones,
  toggleMiddleEast,
  excludedCountries,
  toggleCountry,
  toggleRegion,
}: SearchFormProps) {
  return (
    <div className="space-y-3.5 lg:overflow-y-auto lg:pr-1">
      <AirportAutocomplete
        label="From"
        value={origin}
        onChange={setOrigin}
        placeholder="City or airport code"
      />
      <div className="flex justify-end -my-1.5">
        <button
          type="button"
          onClick={() => {
            const prev = origin;
            setOrigin(destination);
            setDestination(prev);
          }}
          className="card-surface cursor-pointer rounded-full p-1.5 text-ink-muted transition-all hover:text-accent hover:-translate-y-0.5 active:translate-y-0"
          title="Swap origin and destination"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>
      <AirportAutocomplete
        label="To"
        value={destination}
        onChange={setDestination}
        placeholder="City or airport code"
      />
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={setDateRange}
      />
      <div>
        <label className="kicker block mb-1.5">
          Max stops
        </label>
        <select
          value={maxStops}
          onChange={(e) => setMaxStops(Number(e.target.value))}
          className="input-warm cursor-pointer"
        >
          <option value={0}>Direct only</option>
          <option value={1}>1 stop</option>
          <option value={2}>2 stops</option>
          <option value={3}>3 stops</option>
        </select>
      </div>
      <ExclusionToggles
        avoidConflictZones={avoidConflictZones}
        avoidMiddleEast={avoidMiddleEast}
        onToggleConflict={toggleConflictZones}
        onToggleMiddleEast={toggleMiddleEast}
        excludedCount={excludedCountries.size}
      />
      <RegionFilters
        excludedCountries={excludedCountries}
        toggleCountry={toggleCountry}
        toggleRegion={toggleRegion}
      />
    </div>
  );
}
