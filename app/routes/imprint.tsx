import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import type { Route } from "./+types/imprint";
import { pageMeta } from "~/lib/seo";
import { useLocale } from "~/hooks/useLocale";
import {Button} from "~/components/ui/button";
import {XIcon} from "lucide-react";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta("imprint", location);
}

export default function ImprintRoute() {
  const { t } = useTranslation();
  const { localePath } = useLocale();
  return (
    <main className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-[calc(1rem+var(--top-chrome-offset))] text-ink">
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="icon" aria-label={t("common.close")}>
            <Link to={localePath("/")}>
              <XIcon className="size-5"/>
            </Link>
          </Button>
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("routes.imprint.heading")}</h1>

        <p className="mt-4 text-slate-700">
          {t("routes.imprint.intro")}
        </p>

        <dl className="mt-6 space-y-3 text-slate-700">
          <Row label={t("routes.imprint.maintainer")} value="Pitchtrain Developer" />
          <Row
            label={t("routes.imprint.contact")}
            value={
              <a
                href="mailto:pitchtrain@pm.me"
                className="underline"
              >
                pitchtrain@pm.me
              </a>
            }
          />
          <Row
            label={t("routes.imprint.sourceCode")}
            value={
              <a
                href="https://github.com/Pitchtrain/app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                github.com/Pitchtrain/app
              </a>
            }
          />
          <Row
            label={t("routes.imprint.hosting")}
            value={t("routes.imprint.hostingValue")}
          />
        </dl>

        <p className="mt-8 text-sm text-slate-500">
          {t("routes.imprint.responsible")}
        </p>

        <p className="mt-8 text-sm">
          <Trans
            i18nKey="routes.imprint.seeAlso"
            components={[<Link key="0" to={localePath("/privacy")} className="underline" />]}
          />
        </p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
