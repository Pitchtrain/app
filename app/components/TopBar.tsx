import { SiGithub } from "@icons-pack/react-simple-icons";
import { Link } from "react-router";
import { APP_NAME } from "~/lib/appConfig";
import { Button } from "./ui/button";

export function TopBar() {
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
        aria-label="GitHub repository"
      >
        <Link to="https://github.com/Pitchtrain/app" target="_blank" rel="noopener noreferrer">
          <SiGithub className="size-5" />
        </Link>
      </Button>
    </header>
  );
}
