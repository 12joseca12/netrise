"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark";

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  title: string;
  highlightBackground: string;
  highlightText: string;
  border: string;
  muted: string;
  primary: string;
  primarySoft: string;
  success: string;
};

const lightColors: ThemeColors = {
  // Light mode foundations (inspirado en la paleta adjunta)
  background: "#F1F5F9", // Surface Light
  surface: "#FFFFFF",
  surfaceAlt: "#E5E7EB",
  text: "#020617",
  title: "#0B1120",
  highlightBackground: "rgba(59, 130, 246, 0.06)", // Subtle Accent
  highlightText: "#1D4ED8",
  border: "#E2E8F0",
  muted: "#64748B", // Secondary gray-ish text
  primary: "#3B82F6", // Primary Blue
  primarySoft: "rgba(59, 130, 246, 0.12)",
  success: "#10B981", // Success Mint
};

const darkColors: ThemeColors = {
  // Dark mode refinement (inspirado en la paleta adjunta)
  background: "#020617", // Midnight Navy / base background
  surface: "#020617",
  surfaceAlt: "#0B1120",
  text: "#E5E7EB",
  title: "#F9FAFB",
  highlightBackground: "rgba(59, 130, 246, 0.22)",
  highlightText: "#60A5FA",
  border: "#1E293B",
  muted: "#9CA3AF",
  primary: "#3B82F6",
  primarySoft: "rgba(59, 130, 246, 0.28)",
  success: "#10B981",
};

const THEME_STORAGE_KEY = "netrise-theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const colors = theme === "dark" ? darkColors : lightColors;
    const root = document.documentElement.style;
    root.setProperty("--color-background", colors.background);
    root.setProperty("--color-surface", colors.surface);
    root.setProperty("--color-surface-alt", colors.surfaceAlt);
    root.setProperty("--color-text", colors.text);
    root.setProperty("--color-title", colors.title);
    root.setProperty("--color-highlight-bg", colors.highlightBackground);
    root.setProperty("--color-highlight-text", colors.highlightText);
    root.setProperty("--color-border", colors.border);
    root.setProperty("--color-muted", colors.muted);
    root.setProperty("--color-primary", colors.primary);
    root.setProperty("--color-primary-soft", colors.primarySoft);
    root.setProperty("--color-success", colors.success);
  }, [theme, mounted]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      colors: theme === "dark" ? darkColors : lightColors,
      isDark: theme === "dark",
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
