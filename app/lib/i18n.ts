import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../locales/en/common.json";
import de from "../locales/de/common.json";
import { APP_NAME } from "./appConfig";
import { STORAGE_KEYS } from "./storageKeys";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { common: en }, de: { common: de } },
    fallbackLng: "en",
    supportedLngs: ["en", "de"],
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
      defaultVariables: { appName: APP_NAME },
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEYS.language,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

export default i18n;
