"use client";

import * as React from "react";
import type {
  Language,
  TranslationContextType,
  Translations,
} from "@/types/translations";
import { getTranslations } from "@/lib/translations";

export const TranslationContext = React.createContext<
  TranslationContextType | undefined
>(undefined);

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = React.useState<Language>("en");
  const [mounted, setMounted] = React.useState(false);
  const [translations, setTranslations] = React.useState<Translations>(
    getTranslations("en")
  );

  React.useEffect(() => {
    setMounted(true);
    // Load language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (
      savedLanguage &&
      (savedLanguage === "en" ||
        savedLanguage === "fr" ||
        savedLanguage === "de")
    ) {
      setLanguageState(savedLanguage);
      setTranslations(getTranslations(savedLanguage));
    }
  }, []);

  const setLanguage = React.useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      setTranslations(getTranslations(lang));
      if (mounted) {
        localStorage.setItem("language", lang);
      }
    },
    [mounted]
  );

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t: translations,
    }),
    [language, setLanguage, translations]
  );

  // Always provide the context value, even before mounting
  // This prevents errors during SSR/initial render
  // The value will be updated once mounted and localStorage is checked
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = React.useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
