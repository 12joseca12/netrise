"use client";

import { useState, useCallback, KeyboardEvent } from "react";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "",
  id,
  "aria-label": ariaLabel,
  className = "",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag || value.includes(tag)) return;
      onChange([...value, tag]);
      setInputValue("");
    },
    [value, onChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value.length - 1);
      }
    },
    [inputValue, addTag, removeTag, value]
  );

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) addTag(inputValue);
  }, [inputValue, addTag]);

  return (
    <div className={className}>
      <input
        type="text"
        id={id}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" role="list">
          {value.map((tag, i) => (
            <li key={`${tag}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-sm text-[var(--color-text)]">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(i)}
                aria-label={`Quitar ${tag}`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--color-primary)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
