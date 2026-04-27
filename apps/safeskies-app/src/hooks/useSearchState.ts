import { useState, useMemo, useCallback } from "react";
import type { Airport } from "../data/airports";
import { conflictZones, middleEastCodes } from "../data/conflict-zones";
import { regions } from "../data/regions";
import { getDefaultDates } from "../lib/dates";
import { buildKiwiUrls, type KiwiUrl } from "../lib/kiwi-url";

const defaults = getDefaultDates();

function getInitialExcluded(): Set<string> {
  return new Set([...middleEastCodes, ...conflictZones]);
}

export function useSearchState() {
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [maxStops, setMaxStops] = useState(2);
  const [avoidConflictZones, setAvoidConflictZones] = useState(true);
  const [avoidMiddleEast, setAvoidMiddleEast] = useState(true);
  const [excludedCountries, setExcludedCountries] = useState<Set<string>>(
    getInitialExcluded,
  );

  const toggleConflictZones = useCallback(() => {
    setAvoidConflictZones((prev) => {
      const next = !prev;
      setExcludedCountries((excluded) => {
        const updated = new Set(excluded);
        if (next) {
          conflictZones.forEach((c) => updated.add(c));
        } else {
          conflictZones.forEach((c) => {
            // Keep if also in Middle East and ME toggle is on
            if (
              !(
                avoidMiddleEast &&
                (middleEastCodes as readonly string[]).includes(c)
              )
            ) {
              updated.delete(c);
            }
          });
        }
        return updated;
      });
      return next;
    });
  }, [avoidMiddleEast]);

  const toggleMiddleEast = useCallback(() => {
    setAvoidMiddleEast((prev) => {
      const next = !prev;
      setExcludedCountries((excluded) => {
        const updated = new Set(excluded);
        if (next) {
          middleEastCodes.forEach((c) => updated.add(c));
        } else {
          middleEastCodes.forEach((c) => {
            if (
              !(
                avoidConflictZones &&
                (conflictZones as readonly string[]).includes(c)
              )
            ) {
              updated.delete(c);
            }
          });
        }
        return updated;
      });
      return next;
    });
  }, [avoidConflictZones]);

  const toggleCountry = useCallback((code: string) => {
    setExcludedCountries((prev) => {
      const updated = new Set(prev);
      if (updated.has(code)) {
        updated.delete(code);
      } else {
        updated.add(code);
      }
      return updated;
    });
  }, []);

  const toggleRegion = useCallback((regionName: string) => {
    const region = regions.find((r) => r.name === regionName);
    if (!region) return;
    const codes = Object.keys(region.codes);
    setExcludedCountries((prev) => {
      const updated = new Set(prev);
      const allExcluded = codes.every((c) => updated.has(c));
      if (allExcluded) {
        codes.forEach((c) => updated.delete(c));
      } else {
        codes.forEach((c) => updated.add(c));
      }
      return updated;
    });
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const generatedUrls: KiwiUrl[] = useMemo(() => {
    if (!origin || !destination) return [];
    return buildKiwiUrls(
      origin.slug,
      destination.slug,
      startDate,
      endDate,
      maxStops,
      excludedCountries,
    );
  }, [origin, destination, startDate, endDate, maxStops, excludedCountries]);

  return {
    origin,
    setOrigin,
    destination,
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
    generatedUrls,
  };
}
