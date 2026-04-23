export const AUTH_ENTRY_PATH = "/dashboard" as const;
export const POST_AUTH_REDIRECT_PATH = "/" as const;

export const PRIMARY_NAV_ITEMS = [
  { to: "/", label: "Inicio" },
  { to: "/pronosticos", label: "Pronósticos" },
] as const;

export type HeaderAccountState = "loading" | "signedOut" | "signedIn";

export function getHeaderAccountState(currentUser: unknown): HeaderAccountState {
  if (currentUser === undefined) {
    return "loading";
  }

  return currentUser === null ? "signedOut" : "signedIn";
}
