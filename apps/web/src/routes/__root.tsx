import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { title: "La historia de la Quiniela Mundial 2026" },
      { name: "description", content: "Resultados, campeones, cambios de líder y momentos que definieron la quiniela familiar del Mundial 2026." },
      { name: "theme-color", content: "#fff8f7" },
      { property: "og:image", content: "/og-final.svg" },
    ],
  }),
});

function RootComponent() {
  return <><HeadContent /><a className="sr-only fixed left-4 top-4 z-50 rounded-xl bg-[#BD0015] px-4 py-3 text-sm font-semibold text-white focus:not-sr-only" href="#main-content">Saltar al contenido</a><Outlet /></>;
}
