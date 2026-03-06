"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { literals, type Locale, type LiteralsMap } from "@/literals";

const LOCALE_STORAGE_KEY = "netrise-locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof LiteralsMap & string) => string;
  literals: LiteralsMap;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  if (stored === "es" || stored === "en") return stored;
  const browserLang = navigator.language?.slice(0, 2);
  if (browserLang === "en") return "en";
  return "es";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const currentLiterals = literals[locale];

  const t = useCallback(
    (key: keyof LiteralsMap & string): string => {
      return currentLiterals[key] ?? key;
    },
    [currentLiterals]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      literals: currentLiterals,
    }),
    [locale, setLocale, t, currentLiterals]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
