export const PLAYER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const PIN_LOCKOUT_AFTER_FAILURES = 5;
export const PIN_LOCKOUT_MS = 10 * 60 * 1000;

const PIN_VALIDATION_ERROR = "PIN must be 4 alphanumeric characters";

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string) {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export function normalizePin(pin: string) {
  const normalizedPin = pin.trim().toUpperCase();

  if (!/^[A-Z0-9]{4}$/.test(normalizedPin)) {
    throw new Error(PIN_VALIDATION_ERROR);
  }

  return normalizedPin;
}

export async function hashPin(normalizedPin: string, pepper: string) {
  if (!pepper) {
    throw new Error("PIN access is not configured");
  }

  return sha256Hex(`pin:${pepper}:${normalizedPin}`);
}

export function hashSessionToken(token: string) {
  return sha256Hex(`session:${token}`);
}

export function isSessionExpired({ now, expiresAt }: { now: number; expiresAt: number }) {
  return now >= expiresAt;
}

export function getPinPepper() {
  const pepper = process.env.PIN_PEPPER;

  if (!pepper) {
    throw new Error("PIN access is not configured");
  }

  return pepper;
}

export function createSessionExpiration(now: number) {
  return now + PLAYER_SESSION_TTL_MS;
}

export function createSessionToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
}
