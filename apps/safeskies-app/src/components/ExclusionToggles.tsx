import Toggle from "./Toggle";
import { conflictZones, middleEastCodes } from "../data/conflict-zones";
import { regions } from "../data/regions";

interface ExclusionTogglesProps {
  avoidConflictZones: boolean;
  avoidMiddleEast: boolean;
  onToggleConflict: () => void;
  onToggleMiddleEast: () => void;
  excludedCount: number;
}

function codesToNames(codes: readonly string[]): string {
  const allCodes: Record<string, string> = {};
  for (const r of regions) {
    Object.assign(allCodes, r.codes);
  }
  return codes.map((c) => allCodes[c] || c).join(", ");
}

export default function ExclusionToggles({
  avoidConflictZones,
  avoidMiddleEast,
  onToggleConflict,
  onToggleMiddleEast,
  excludedCount,
}: ExclusionTogglesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="kicker">Safety Filters</label>
        {excludedCount > 0 && (
          <span className="font-mono text-[10px] text-accent font-medium">
            {excludedCount} excluded
          </span>
        )}
      </div>
      <Toggle
        checked={avoidConflictZones}
        onChange={onToggleConflict}
        label="Avoid conflict zones"
        description="16 countries with active conflicts or airspace restrictions"
        tooltip={codesToNames(conflictZones)}
      />
      <Toggle
        checked={avoidMiddleEast}
        onChange={onToggleMiddleEast}
        label="Avoid Middle East stopovers"
        description="Gulf states, Levant, and surrounding countries"
        tooltip={codesToNames(middleEastCodes)}
      />
    </div>
  );
}
