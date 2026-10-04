import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en/common.json";
import de from "../locales/de/common.json";
import { APP_NAME } from "./appConfig";
import { DEFAULT_LOCALE, LOCALES, localeFromPath, stripBasename } from "./locale";

// The URL decides the language (see docs/adr/0001-locale-urls.md). Reading it
// up front keeps the first client render identical to the prerendered HTML.
const initialLocale =
  typeof window === "undefined"
    ? DEFAULT_LOCALE
    : localeFromPath(stripBasename(window.location.pathname));

void i18n.use(initReactI18next).init({
  resources: { en: { common: en }, de: { common: de } },
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...LOCALES],
  defaultNS: "common",
  ns: ["common"],
  initAsync: false,
  interpolation: {
    escapeValue: false,
    defaultVariables: { appName: APP_NAME },
  },
  react: { useSuspense: false },
});

export default i18n;
