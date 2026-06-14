import {isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration,} from "react-router";
import {useTranslation} from "react-i18next";

import type {Route} from "./+types/root";
import "./app.css";
import "./lib/i18n";
import {APP_NAME} from "./lib/appConfig";
import {Toaster} from "./components/ui/sonner";
import {TooltipProvider} from "./components/ui/tooltip";
import {useServiceWorkerRegistration} from "./hooks/useServiceWorkerRegistration";

export const links: Route.LinksFunction = () => [
    {rel: "icon", type: "image/svg+xml", href: "/icon.svg"},
    {rel: "manifest", href: "/manifest.webmanifest"},
    {rel: "apple-touch-icon", href: "/apple-touch-icon-180x180.png"},
    {rel: "mask-icon", href: "/icon.svg", color: "#102033"},
];

export function Layout({children}: { children: React.ReactNode }) {
    const {i18n} = useTranslation();
    return (
        <html lang={i18n.resolvedLanguage ?? i18n.language ?? "en"}>
        <head>
            <meta charSet="utf-8"/>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
            />
            <meta name="application-name" content={APP_NAME}/>
            <meta name="theme-color" content="#102033"/>
            <meta name="apple-mobile-web-app-capable" content="yes"/>
            <meta name="apple-mobile-web-app-title" content={APP_NAME}/>
            <meta
                name="apple-mobile-web-app-status-bar-style"
                content="black-translucent"
            />
            <Meta/>
            <Links/>
        </head>
        <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-center"/>
        <ScrollRestoration/>
        <Scripts/>
        </body>
        </html>
    );
}

export default function App() {
    useServiceWorkerRegistration();
    return <Outlet/>;
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="container mx-auto p-4 pt-16">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
            )}
        </main>
    );
}
