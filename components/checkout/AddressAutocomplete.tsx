"use client";

import { useState } from "react";
import { PinIcon } from "@/components/ui/Icons";
import { regionName } from "@/lib/address/countries";
import { searchAddresses, type AddressSuggestion } from "@/lib/checkout/addresses";
import { FormField } from "./FormField";

/** Figma shows the compact US form ("New York, NY 10012"); elsewhere the region's name. */
const suggestionPlace = (s: AddressSuggestion) => [s.city, s.country === "US" ? s.state : regionName(s.country, s.state)].filter(Boolean).join(", ") + ` ${s.zip}`;

/** Figma "State / Address — Autocomplete" (Checkout States 54:177) — mock suggestions, keyboard-navigable combobox. */
export function AddressAutocomplete({
  value,
  country,
  onChange,
  onSelect,
  onBlur,
  error,
  idPrefix = "",
}: {
  value: string;
  /** ISO code — only addresses in this country are suggested. */
  country: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  onBlur?: () => void;
  error?: string;
  /** Namespaces element ids so two autocompletes (e.g. delivery + billing) can coexist on one page. */
  idPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = open ? searchAddresses(value, country) : [];
  const fieldId = `${idPrefix}address1`;
  const listId = `${idPrefix}address-suggestions`;

  function pick(suggestion: AddressSuggestion) {
    onSelect(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative w-full">
      <FormField
        id={fieldId}
        name="address1"
        label="Address"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
          onBlur?.();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Street address and number"
        error={error}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${idPrefix}address-option-${activeIndex}` : undefined}
      />
      {open && suggestions.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-2 w-full rounded-[20px] border border-line bg-surface py-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
          {suggestions.map((s, i) => (
            <li
              key={`${s.country}-${s.line1}-${s.zip}`}
              id={`${idPrefix}address-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex cursor-pointer items-center gap-3 px-5 py-3 ${i === activeIndex ? "bg-blob" : ""}`}
            >
              <PinIcon size={16} className="shrink-0 text-ink-muted" />
              <span className="type-body text-ink">
                <strong>{s.line1.slice(0, value.length)}</strong>
                {s.line1.slice(value.length)}
              </span>
              <span className="type-caption ml-auto shrink-0 whitespace-nowrap text-ink-muted">
                {suggestionPlace(s)}
              </span>
            </li>
          ))}
          <li className="border-t border-line px-5 pt-3">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              className="type-caption pb-1 text-ink underline decoration-from-font"
            >
              Enter address manually
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
