import { useState, useRef, useEffect, useCallback } from "react";
import type { Airport } from "../data/airports";
import { airports } from "../data/airports";
import { searchAirports } from "../lib/search-airports";

interface AirportAutocompleteProps {
  label: string;
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
}

export default function AirportAutocomplete({
  label,
  value,
  onChange,
  placeholder = "City or airport code",
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = searchAirports(query, airports);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightIndex(-1);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
        if (isEditing && !query.trim()) {
          setIsEditing(false);
        } else if (isEditing) {
          setIsEditing(false);
          setQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close, isEditing, query]);

  function startEditing() {
    setIsEditing(true);
    setQuery("");
    setIsOpen(true);
    setHighlightIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(airport: Airport) {
    onChange(airport);
    setQuery("");
    setIsEditing(false);
    close();
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) {
      if (e.key === "Escape") {
        close();
        setIsEditing(false);
        setQuery("");
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      select(results[highlightIndex]);
    } else if (e.key === "Escape") {
      close();
      setIsEditing(false);
      setQuery("");
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightIndex(-1);
    if (!e.target.value.trim()) {
      onChange(null);
    }
  }

  function handleFocus() {
    setIsOpen(true);
    setHighlightIndex(-1);
  }

  const showInput = !value || isEditing;

  return (
    <div ref={containerRef} className="relative">
      <label className="kicker block mb-1.5">{label}</label>
      <div className="relative">
        {!showInput ? (
          <div
            onClick={startEditing}
            className="input-warm flex cursor-pointer items-center justify-between transition-all hover:border-line-strong"
          >
            <span className="text-sm font-medium text-ink">
              {value.city}, {value.country}
              <span className="ml-2 font-mono text-[11px] text-ink-muted">
                {value.iata}
              </span>
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-2 rounded-md p-1 text-ink-muted transition-colors hover:text-ink hover:bg-accent-soft"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="input-warm"
          />
        )}

        {isOpen && results.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-line bg-parchment-light py-1"
            style={{ boxShadow: "var(--shadow-dropdown)" }}
          >
            {!query.trim() && (
              <li className="kicker px-3 py-1.5 text-ink-muted">
                Popular
              </li>
            )}
            {results.map((airport, i) => (
              <li
                key={airport.iata}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(airport);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                  i === highlightIndex
                    ? "bg-accent-soft text-ink"
                    : "text-ink-soft"
                }`}
              >
                <span className="font-medium">
                  {airport.city}
                  <span className="font-normal text-ink-muted">, {airport.country}</span>
                </span>
                <span className="font-mono text-[11px] text-ink-muted">
                  {airport.iata}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
