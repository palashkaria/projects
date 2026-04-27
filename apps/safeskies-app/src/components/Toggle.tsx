interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
  tooltip?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  tooltip,
}: ToggleProps) {
  return (
    <div className="card-surface flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="shrink-0"
      >
        <div
          className={`relative h-[22px] w-10 rounded-full transition-colors duration-200 cursor-pointer ${
            checked ? "bg-accent" : "bg-ink-muted/30"
          }`}
        >
          <div
            className={`absolute top-[3px] left-[3px] h-4 w-4 rounded-full bg-parchment-light shadow-sm transition-transform duration-200 ${
              checked ? "translate-x-[18px]" : "translate-x-0"
            }`}
          />
        </div>
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="min-w-0 flex-1 text-left cursor-pointer"
      >
        <div className="text-sm font-medium text-ink">{label}</div>
        {description && (
          <div className="mt-0.5 text-[11px] text-ink-muted leading-snug">{description}</div>
        )}
      </button>
      {tooltip && (
        <div className="group relative shrink-0">
          <div className="grid h-5 w-5 place-items-center rounded-full border border-line text-ink-muted transition-colors hover:border-line-strong hover:text-ink-soft cursor-help">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </div>
          <div className="pointer-events-none absolute right-0 bottom-full mb-2 z-50 w-64 rounded-xl border border-line bg-parchment-light p-3 text-[11px] leading-relaxed text-ink-soft opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto"
            style={{ boxShadow: "var(--shadow-dropdown)" }}
          >
            {tooltip}
          </div>
        </div>
      )}
    </div>
  );
}
