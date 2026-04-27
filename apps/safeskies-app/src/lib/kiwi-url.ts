import { formatPrettyDate, getDayName } from "./dates";

export interface KiwiUrl {
  url: string;
  date: string;
  dayOfWeek: string;
  prettyDate: string;
}

export function buildKiwiUrls(
  fromSlug: string,
  toSlug: string,
  startDate: string,
  endDate: string,
  maxStops: number,
  excludedCountries: Set<string>,
): KiwiUrl[] {
  const results: KiwiUrl[] = [];
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  const d = new Date(start);
  while (d <= end) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const params = new URLSearchParams();
    params.set("stopNumber", `${maxStops}~true`);
    if (excludedCountries.size > 0) {
      params.set(
        "stopoverCountriesList",
        [...excludedCountries].sort().join(","),
      );
    }

    results.push({
      url: `https://www.kiwi.com/en/search/results/${fromSlug}/${toSlug}/${dateStr}/no-return/?${params.toString()}`,
      date: dateStr,
      dayOfWeek: getDayName(dateStr),
      prettyDate: formatPrettyDate(dateStr),
    });

    d.setDate(d.getDate() + 1);
  }

  return results;
}
