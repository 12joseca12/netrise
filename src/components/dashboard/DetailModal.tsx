"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; label: string; value?: string }[];
}

export function DetailModal({ open, onClose, title, items }: DetailModalProps) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && ref.current) {
      const focusable = ref.current.querySelector<HTMLElement>("button, [href], input, select, textarea");
      focusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={ref}
        className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h2 id="detail-modal-title" className="text-lg font-semibold text-[var(--color-title)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label={t("dashboard.modal.close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No hay datos para mostrar.</p>
          ) : (
            <ul className="space-y-2" role="list">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]"
                >
                  <span>{item.label}</span>
                  {item.value != null && <span className="font-medium text-[var(--color-title)]">{item.value}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
