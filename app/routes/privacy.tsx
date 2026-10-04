import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import type { Route } from "./+types/privacy";
import { pageMeta } from "~/lib/seo";
import { useLocale } from "~/hooks/useLocale";
import {Button} from "~/components/ui/button";
import {XIcon} from "lucide-react";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta("privacy", location);
}

export default function PrivacyRoute() {
  const { t } = useTranslation();
  const { localePath } = useLocale();
  return (
    <main className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] text-ink">
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="icon" aria-label={t("common.close")}>
            <Link to={localePath("/")}>
              <XIcon className="size-5"/>
            </Link>
          </Button>
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t("routes.privacy.heading")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("routes.privacy.lastUpdated", { date: "{{DATE}}" })}
        </p>

        <Section title={t("routes.privacy.section1Title")}>
          <p>{t("routes.privacy.section1Body")}</p>
        </Section>

        <Section title={t("routes.privacy.section2Title")}>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Trans
                i18nKey="routes.privacy.section2Item1"
                components={[<strong key="0"/>, <code key="1"/>]}
              />
            </li>
            <li>
              <Trans
                i18nKey="routes.privacy.section2Item2"
                components={[<strong key="0"/>, <code key="1"/>, <code key="2"/>, <code key="3"/>]}
              />
            </li>
            <li>
              <Trans
                i18nKey="routes.privacy.section2Item3"
                components={[<strong key="0"/>]}
              />
            </li>
          </ul>
        </Section>

        <Section title={t("routes.privacy.section3Title")}>
          <p>
            <Trans
              i18nKey="routes.privacy.section3Body1"
              components={[
                <strong key="0"/>,
                <a
                  key="1"
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                />,
              ]}
            />
          </p>
          <p className="mt-2">
            <Trans
              i18nKey="routes.privacy.section3Body2"
              components={[<strong key="0"/>]}
            />
          </p>
        </Section>

        <Section title={t("routes.privacy.section4Title")}>
          <p>{t("routes.privacy.section4Body")}</p>
        </Section>

        <Section title={t("routes.privacy.section5Title")}>
          <p>{t("routes.privacy.section5Body1")}</p>
          <p className="mt-2">{t("routes.privacy.section5Body2")}</p>
        </Section>

        <Section title={t("routes.privacy.section6Title")}>
          <p>
            <Trans
              i18nKey="routes.privacy.section6Body"
              components={[<Link key="0" to={localePath("/imprint")} className="underline" />]}
            />
          </p>
        </Section>

        <Section title={t("routes.privacy.section7Title")}>
          <p>{t("routes.privacy.section7Body")}</p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-2 text-slate-700">{children}</div>
    </section>
  );
}
