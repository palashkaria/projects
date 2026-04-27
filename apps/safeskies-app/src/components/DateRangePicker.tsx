interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  return (
    <div>
      <label className="kicker block mb-1.5">
        Departure dates
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            const newStart = e.target.value;
            onChange(newStart, endDate < newStart ? newStart : endDate);
          }}
          className="input-warm flex-1"
        />
        <span className="text-ink-muted text-xs font-medium">to</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => onChange(startDate, e.target.value)}
          className="input-warm flex-1"
        />
      </div>
    </div>
  );
}
