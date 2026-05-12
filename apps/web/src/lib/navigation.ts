export const AUTH_ENTRY_PATH = "/dashboard" as const;
export const POST_AUTH_REDIRECT_PATH = "/" as const;

export const PRIMARY_NAV_ITEMS = [
  { to: "/", label: "Inicio" },
  { to: "/pronosticos", label: "Pronósticos" },
] as const;

export type HeaderAccountState = "loading" | "signedOut" | "signedIn";

export type HeaderAccountAffordance = {
  eyebrow: string;
  label: string;
};

const HEADER_ACCOUNT_AFFORDANCES: Record<Exclude<HeaderAccountState, "signedIn">, HeaderAccountAffordance> = {
  loading: {
    eyebrow: "Cuenta",
    label: "Cargando acceso",
  },
  signedOut: {
    eyebrow: "Tu cuenta",
    label: "Entrar o crear cuenta",
  },
};

export function getHeaderAccountState(currentUser: unknown): HeaderAccountState {
  if (currentUser === undefined) {
    return "loading";
  }

  return currentUser === null ? "signedOut" : "signedIn";
}

export function getHeaderAccountAffordance(
  accountState: Exclude<HeaderAccountState, "signedIn">,
): HeaderAccountAffordance {
  return HEADER_ACCOUNT_AFFORDANCES[accountState];
}
