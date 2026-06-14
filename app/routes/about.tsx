import { Link, useNavigate } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import type { Route } from "./+types/about";
import { Button } from "~/components/ui/button";
import { resetOnboarding } from "~/onboarding";
import { APP_NAME } from "~/lib/appConfig";
import { seoLinks, seoMeta } from "~/lib/seo";
import React from "react";
import {XIcon} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "About",
    description: `${APP_NAME} is an open-source voice pitch trainer with real-time pitch visualization, target ranges, recordings, and a private browser journal.`,
    path: "/about",
  });
}

export const links: Route.LinksFunction = () => seoLinks("/about");

export default function AboutRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function restartTour() {
    resetOnboarding();
    void navigate("/welcome");
  }

  return (
    <main className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] text-ink">
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="icon" aria-label={t("common.close")}>
            <Link to="/">
              <XIcon className="size-5"/>
            </Link>
          </Button>
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t("routes.about.heading")}
        </h1>
        <p className="mt-3 text-slate-700">
          {t("routes.about.intro")}
        </p>

        <Section emoji="⚠️" title={t("routes.about.notMedicalTitle")}>
          <p>{t("routes.about.notMedicalBody")}</p>
        </Section>

        <Section emoji="✨" title={t("routes.about.featuresTitle")}>
          <ul className="list-disc space-y-1 pl-6">
            <li>{t("routes.about.feature1")}</li>
            <li>{t("routes.about.feature2")}</li>
            <li>{t("routes.about.feature3")}</li>
            <li>{t("routes.about.feature4")}</li>
            <li>{t("routes.about.feature5")}</li>
            <li>{t("routes.about.feature6")}</li>
          </ul>
        </Section>

        <Section emoji="🔒" title={t("routes.about.dataTitle")}>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Trans i18nKey="routes.about.dataItem1" components={[<code key="0"/>]} />
            </li>
            <li>
              <Trans i18nKey="routes.about.dataItem2" components={[<code key="0"/>, <code key="1"/>, <code key="2"/>]} />
            </li>
            <li>{t("routes.about.dataItem3")}</li>
            <li>{t("routes.about.dataItem4")}</li>
          </ul>
          <p className="mt-2 text-sm text-slate-600">
            <Trans
              i18nKey="routes.about.seePrivacy"
              components={[
                <Link key="0" to="/privacy" className="underline" />,
                <Link key="1" to="/imprint" className="underline" />,
              ]}
            />
          </p>
        </Section>

        <Section emoji="🧭" title={t("routes.about.restartTitle")}>
          <p>{t("routes.about.restartBody")}</p>
          <Button onClick={restartTour} className="mt-3">
            {t("settings.restartTour")}
          </Button>
        </Section>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link to="/imprint" className="underline underline-offset-4">
            {t("common.imprint")}
          </Link>
          <Link to="/privacy" className="underline underline-offset-4">
            {t("common.privacy")}
          </Link>
          <a
            href="https://github.com/Pitchtrain/app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {t("routes.about.sourceOnGitHub")}
          </a>
        </div>
      </div>
    </main>
  );
}

function Section({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <span>{emoji}</span>
        <span>{title}</span>
      </h2>
      <div className="mt-2 space-y-2 text-slate-700">{children}</div>
    </section>
  );
}
