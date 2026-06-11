export const AUTH_ENTRY_PATH = "/" as const;
export const POST_AUTH_REDIRECT_PATH = "/" as const;

export const PRIMARY_NAV_ITEMS = [
  { to: "/", hash: undefined, label: "Inicio", labelKey: "home" },
  { to: "/dashboard", hash: undefined, label: "Tablero", labelKey: "dashboard" },
  { to: "/manual", hash: undefined, label: "Manual", labelKey: "manual" },
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

function getFirstName(displayName: string, fallbackLabel = HEADER_ACCOUNT_AFFORDANCES.storedPlayer.label) {
  return displayName.trim().split(/\s+/)[0] || fallbackLabel;
}

export function getHeaderAccountState(storedSession: unknown): HeaderAccountState {
  return storedSession ? "storedPlayer" : "needsPin";
}

export function getHeaderAccountAffordance(
  accountState: HeaderAccountState,
  displayName?: string | null,
  labels: Partial<Record<HeaderAccountState, HeaderAccountAffordance>> = {},
): HeaderAccountAffordance {
  const affordances = {
    needsPin: labels.needsPin ?? HEADER_ACCOUNT_AFFORDANCES.needsPin,
    storedPlayer: labels.storedPlayer ?? HEADER_ACCOUNT_AFFORDANCES.storedPlayer,
  };

  if (accountState === "storedPlayer") {
    return {
      eyebrow: affordances.storedPlayer.eyebrow,
      label: displayName ? getFirstName(displayName, affordances.storedPlayer.label) : affordances.storedPlayer.label,
    };
  }

  return affordances[accountState];
}

export function shouldShowPrimaryNav(_accountState: HeaderAccountState) {
  return true;
}
