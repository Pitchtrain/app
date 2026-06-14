import type { Route } from "./+types/welcome";
import { WelcomeStepper } from "~/components/onboarding/WelcomeStepper";
import { APP_NAME } from "~/lib/appConfig";
import { seoLinks, seoMeta } from "~/lib/seo";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "Welcome",
    description: `Set up ${APP_NAME} for private, browser-based voice pitch practice with range targets, recording, playback, and offline use.`,
    path: "/welcome",
    noindex: true,
  });
}

export const links: Route.LinksFunction = () => seoLinks("/welcome");

export default function WelcomeRoute() {
  return (
    <main className="flex min-h-[100dvh] items-stretch justify-center bg-canvas lg:items-center lg:py-6">
      <WelcomeStepper />
    </main>
  );
}
