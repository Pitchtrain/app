import type { Route } from "./+types/welcome";
import { WelcomeStepper } from "~/components/onboarding/WelcomeStepper";
import { pageMeta } from "~/lib/seo";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta("welcome", location);
}

export default function WelcomeRoute() {
  return (
    <main className="flex min-h-[100dvh] items-stretch justify-center bg-canvas lg:items-center lg:py-6">
      <WelcomeStepper />
    </main>
  );
}
