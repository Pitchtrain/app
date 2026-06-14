import { InfoIcon } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "~/lib/appConfig";
import { Button } from "./ui/button";

export function TopBar() {
  const { t } = useTranslation();
  return (
    <header
      className="hidden shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/80 px-3 backdrop-blur-sm lg:flex"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        minHeight: "calc(3rem + env(safe-area-inset-top))",
      }}
    >
      <h1 className="text-lg font-semibold tracking-tight text-ink">{APP_NAME}</h1>
      <Button
        asChild
        variant="ghost"
        size="icon"
        aria-label={t("common.aboutApp")}
      >
        <Link to="/about">
          <InfoIcon className="size-5" />
        </Link>
      </Button>
    </header>
  );
}
