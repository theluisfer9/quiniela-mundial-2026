import { Toaster } from "@quiniela-mundial-2026/ui/components/sonner";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Quiniela Mundial 2026 | Pronosticos en familia",
      },
      {
        name: "description",
        content:
          "Quiniela Mundial 2026 is a cheerful prediction app for tracking matches, entering scores, and playing the tournament with friends and family.",
      },
      {
        name: "theme-color",
        content: "#f9f6ef",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        enableSystem={false}
        forcedTheme="light"
      >
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-50 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),transparent_34%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_90%,white)_100%)] text-foreground">
          <div className="mx-auto grid min-h-svh w-full max-w-6xl grid-rows-[auto_1fr] px-4 sm:px-6 lg:px-8">
            <Header />
            <main id="main-content" className="pb-8 pt-4 sm:pb-10 sm:pt-6">
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
