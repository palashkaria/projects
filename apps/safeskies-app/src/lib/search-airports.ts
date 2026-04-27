import type { Airport } from "../data/airports";

const POPULAR_IATAS = [
  "LHR", "CDG", "JFK", "SIN", "BKK", "NRT", "BLR", "DEL",
  "BOM", "DXB", "HKG", "ICN", "KUL", "SFO", "AMS", "IST",
];

export function getPopularAirports(airports: Airport[]): Airport[] {
  const result: Airport[] = [];
  for (const iata of POPULAR_IATAS) {
    const found = airports.find((a) => a.iata === iata);
    if (found) result.push(found);
    if (result.length >= 8) break;
  }
  return result;
}

export function searchAirports(query: string, airports: Airport[]): Airport[] {
  const q = query.toLowerCase().trim();
  if (!q) return getPopularAirports(airports);

  const exactIata: Airport[] = [];
  const iataPrefix: Airport[] = [];
  const cityPrefix: Airport[] = [];
  const countryPrefix: Airport[] = [];
  const cityContains: Airport[] = [];

  for (const airport of airports) {
    const iata = airport.iata.toLowerCase();
    const city = airport.city.toLowerCase();
    const country = airport.country.toLowerCase();

    if (iata === q) {
      exactIata.push(airport);
    } else if (iata.startsWith(q)) {
      iataPrefix.push(airport);
    } else if (city.startsWith(q)) {
      cityPrefix.push(airport);
    } else if (country.startsWith(q)) {
      countryPrefix.push(airport);
    } else if (city.includes(q)) {
      cityContains.push(airport);
    }
  }

  return [
    ...exactIata,
    ...iataPrefix,
    ...cityPrefix,
    ...countryPrefix,
    ...cityContains,
  ].slice(0, 8);
}
