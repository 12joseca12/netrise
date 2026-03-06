"use client";

import { ThemeProvider } from "./ThemeContext";
import { LanguageProvider } from "./LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
