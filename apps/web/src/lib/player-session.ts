export const PLAYER_SESSION_STORAGE_KEY = "quiniela.playerSession";
export const PLAYER_SESSION_CHANGED_EVENT = "quiniela:player-session-changed";

export type StoredPlayerSession = {
  sessionToken: string;
  displayName: string;
};

function getBrowserLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return null;
    }

    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function dispatchPlayerSessionChanged() {
  try {
    window.dispatchEvent(new Event(PLAYER_SESSION_CHANGED_EVENT));
  } catch {
    return;
  }
}

export function subscribeToPlayerSessionChanges(listener: () => void) {
  try {
    if (typeof window === "undefined") {
      return () => {};
    }

    window.addEventListener(PLAYER_SESSION_CHANGED_EVENT, listener);
    return () => window.removeEventListener(PLAYER_SESSION_CHANGED_EVENT, listener);
  } catch {
    return () => {};
  }
}

function isStoredPlayerSession(value: unknown): value is StoredPlayerSession {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StoredPlayerSession).sessionToken === "string" &&
    typeof (value as StoredPlayerSession).displayName === "string"
  );
}

function sanitizePlayerSession(session: StoredPlayerSession): StoredPlayerSession {
  return {
    sessionToken: session.sessionToken,
    displayName: session.displayName,
  };
}

function setStoredPlayerSession(session: StoredPlayerSession, options: { notify?: boolean } = {}) {
  const localStorage = getBrowserLocalStorage();

  if (!localStorage) {
    return;
  }

  try {
    localStorage.setItem(PLAYER_SESSION_STORAGE_KEY, JSON.stringify(sanitizePlayerSession(session)));

    if (options.notify !== false) {
      dispatchPlayerSessionChanged();
    }
  } catch {
    return;
  }
}

function removeStoredPlayerSession(options: { notify?: boolean } = {}) {
  const localStorage = getBrowserLocalStorage();

  if (!localStorage) {
    return;
  }

  try {
    localStorage.removeItem(PLAYER_SESSION_STORAGE_KEY);

    if (options.notify !== false) {
      dispatchPlayerSessionChanged();
    }
  } catch {
    return;
  }
}

export function getStoredPlayerSession(): StoredPlayerSession | null {
  const localStorage = getBrowserLocalStorage();

  if (!localStorage) {
    return null;
  }

  let storedValue: string | null;

  try {
    storedValue = localStorage.getItem(PLAYER_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!storedValue) {
    return null;
  }

  try {
    const session = JSON.parse(storedValue) as unknown;

    if (!isStoredPlayerSession(session)) {
      removeStoredPlayerSession({ notify: false });
      return null;
    }

    const sanitizedSession = sanitizePlayerSession(session);
    setStoredPlayerSession(sanitizedSession, { notify: false });

    return sanitizedSession;
  } catch {
    removeStoredPlayerSession({ notify: false });
    return null;
  }
}

export function storePlayerSession(session: StoredPlayerSession) {
  setStoredPlayerSession(session);
}

export function clearPlayerSession() {
  removeStoredPlayerSession();
}
