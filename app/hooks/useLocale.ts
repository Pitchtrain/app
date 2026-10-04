import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { type Locale, localeFromPath, localizePath, storeLocale } from "~/lib/locale";

export function useLocale() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = localeFromPath(location.pathname);

  const localePath = useCallback((path: string) => localizePath(path, locale), [locale]);

  const switchLocale = useCallback(
    (next: Locale) => {
      storeLocale(next);
      void i18n.changeLanguage(next);
      if (next === locale) return;
      void navigate(
        {
          pathname: localizePath(location.pathname, next),
          search: location.search,
          hash: location.hash,
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [i18n, locale, location, navigate],
  );

  return { locale, localePath, switchLocale };
}
