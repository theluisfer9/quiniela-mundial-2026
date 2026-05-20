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
        content: "#fff8f7",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anybody:wght@500;600;700;800&family=Lexend:wght@400;500;600;700&display=swap",
      },
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
        <div className="min-h-svh bg-[radial-gradient(circle_at_18%_0%,rgba(230,29,37,0.12),transparent_26%),radial-gradient(circle_at_92%_18%,rgba(42,57,141,0.12),transparent_24%),linear-gradient(180deg,#fff8f7_0%,#fff0ef_42%,#ffffff_100%)] text-foreground">
          <div className="mx-auto grid min-h-svh w-full max-w-6xl grid-rows-[auto_1fr] px-4 sm:px-6 lg:px-8">
            <Header />
            <main id="main-content" tabIndex={-1} className="pb-24 pt-8 sm:pb-10 sm:pt-6">
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
