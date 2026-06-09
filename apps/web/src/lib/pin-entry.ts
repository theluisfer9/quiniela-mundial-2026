export const INVALID_PIN_MESSAGE = "PIN no reconocido. Revisa el codigo que te compartieron.";
export const LOCKED_PIN_MESSAGE = "Demasiados intentos. Prueba de nuevo en unos minutos.";

export function normalizePlayerPin(pin: string) {
  return pin.trim().toUpperCase();
}

export function isValidPlayerPin(pin: string) {
  return /^[A-Z0-9]{4}$/.test(normalizePlayerPin(pin));
}

export function isPinEntrySubmittable(pin: string) {
  return isValidPlayerPin(pin);
}
