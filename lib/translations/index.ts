import type { Language, Translations } from "@/types/translations";
import enTranslations from "./en.json";
import frTranslations from "./fr.json";
import deTranslations from "./de.json";

export const translations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  fr: frTranslations as Translations,
  de: deTranslations as Translations,
};

export const getTranslations = (language: Language): Translations => {
  return translations[language];
};

