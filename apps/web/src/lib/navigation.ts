export const AUTH_ENTRY_PATH = "/" as const;
export const POST_AUTH_REDIRECT_PATH = "/" as const;

export const PRIMARY_NAV_ITEMS = [
  { to: "/", hash: undefined, label: "Inicio" },
  { to: "/dashboard", hash: undefined, label: "Tablero" },
  { to: "/manual", hash: undefined, label: "Manual" },
] as const;

export type HeaderAccountState = "needsPin" | "storedPlayer";

export type HeaderAccountAffordance = {
  eyebrow: string;
  label: string;
};

const HEADER_ACCOUNT_AFFORDANCES: Record<HeaderAccountState, HeaderAccountAffordance> = {
  needsPin: {
    eyebrow: "Acceso con PIN",
    label: "Entrar con PIN",
  },
  storedPlayer: {
    eyebrow: "Jugador guardado",
    label: "Jugador guardado",
  },
};

function getFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || HEADER_ACCOUNT_AFFORDANCES.storedPlayer.label;
}

export function getHeaderAccountState(storedSession: unknown): HeaderAccountState {
  return storedSession ? "storedPlayer" : "needsPin";
}

export function getHeaderAccountAffordance(
  accountState: HeaderAccountState,
  displayName?: string | null,
): HeaderAccountAffordance {
  if (accountState === "storedPlayer") {
    return {
      eyebrow: HEADER_ACCOUNT_AFFORDANCES.storedPlayer.eyebrow,
      label: displayName ? getFirstName(displayName) : HEADER_ACCOUNT_AFFORDANCES.storedPlayer.label,
    };
  }

  return HEADER_ACCOUNT_AFFORDANCES[accountState];
}

export function shouldShowPrimaryNav(_accountState: HeaderAccountState) {
  return true;
}
