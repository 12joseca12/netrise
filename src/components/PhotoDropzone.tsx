"use client";

import { useCallback, useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export interface PhotoDropzoneProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  optionalLabel?: string;
  dropText: string;
  selectText: string;
  "aria-label"?: string;
}

export function PhotoDropzone({
  value,
  onChange,
  label,
  optionalLabel,
  dropText,
  selectText,
  "aria-label": ariaLabel,
}: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") onChange(result);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
      e.target.value = "";
    },
    [readFile]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="mb-6">
      <span className="mb-2 block text-sm font-medium text-[var(--color-title)]">
        {label} {optionalLabel != null && <span className="text-[var(--color-muted)]">({optionalLabel})</span>}
      </span>
      <div
        className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 transition-colors"
          style={{ borderColor: isDragging ? "var(--color-primary)" : undefined, backgroundColor: isDragging ? "var(--color-primary-soft)" : undefined }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel ?? label}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden
          />
          <p className="text-center text-sm text-[var(--color-muted)]">
            {dropText}{" "}
            <span className="font-medium text-[var(--color-primary)] underline">{selectText}</span>
          </p>
      </div>
    </div>
  );
}
