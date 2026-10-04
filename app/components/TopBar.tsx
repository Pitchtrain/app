import { APP_NAME } from "~/lib/appConfig";

export function TopBar() {
  return (
    <header
      className="hidden shrink-0 items-center border-b border-slate-200/60 bg-white/80 px-3 backdrop-blur-sm lg:flex"
      style={{
        paddingTop: "var(--top-chrome-offset)",
        minHeight: "calc(3rem + var(--top-chrome-offset))",
      }}
    >
      <h1 className="text-lg font-semibold tracking-tight text-ink">{APP_NAME}</h1>
    </header>
  );
}
