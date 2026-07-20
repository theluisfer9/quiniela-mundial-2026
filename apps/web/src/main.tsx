import { RouterProvider, createRouter } from "@tanstack/react-router";
import "@fontsource-variable/anybody/wght.css";
import "@fontsource-variable/lexend/wght.css";
import ReactDOM from "react-dom/client";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

const MODULE_RECOVERY_KEY = "quiniela-module-recovery-attempted";

async function resetBrowserAppCache() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
}

function recoverFromStaleModule(reason: unknown) {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  if (!/importing a module script failed|failed to fetch dynamically imported module|loading chunk|module script/i.test(message)) {
    return;
  }

  if (sessionStorage.getItem(MODULE_RECOVERY_KEY) === "true") {
    return;
  }

  sessionStorage.setItem(MODULE_RECOVERY_KEY, "true");
  void resetBrowserAppCache().finally(() => window.location.reload());
}

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverFromStaleModule((event as Event & { payload?: unknown }).payload);
});

window.addEventListener("unhandledrejection", (event) => {
  recoverFromStaleModule(event.reason);
});

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultPendingComponent: () => <Loader />,
  context: {},
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
