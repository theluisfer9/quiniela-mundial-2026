const OPERATOR_SESSION_STORAGE_KEY = "quiniela.scoreOperatorSession";
const OPERATOR_SESSION_CHANGED_EVENT = "quiniela:operator-session-changed";

export type StoredOperatorSession = {
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

function isStoredOperatorSession(value: unknown): value is StoredOperatorSession {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StoredOperatorSession).sessionToken === "string" &&
    typeof (value as StoredOperatorSession).displayName === "string"
  );
}

function dispatchOperatorSessionChanged() {
  try {
    window.dispatchEvent(new Event(OPERATOR_SESSION_CHANGED_EVENT));
  } catch {
    return;
  }
}

export function subscribeToOperatorSessionChanges(listener: () => void) {
  try {
    if (typeof window === "undefined") {
      return () => {};
    }

    window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, listener);
    return () => window.removeEventListener(OPERATOR_SESSION_CHANGED_EVENT, listener);
  } catch {
    return () => {};
  }
}

export function getStoredOperatorSession(): StoredOperatorSession | null {
  const localStorage = getBrowserLocalStorage();
  if (!localStorage) {
    return null;
  }

  try {
    const storedValue = localStorage.getItem(OPERATOR_SESSION_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const session = JSON.parse(storedValue) as unknown;
    if (!isStoredOperatorSession(session)) {
      localStorage.removeItem(OPERATOR_SESSION_STORAGE_KEY);
      return null;
    }

    return {
      displayName: session.displayName,
      sessionToken: session.sessionToken,
    };
  } catch {
    localStorage.removeItem(OPERATOR_SESSION_STORAGE_KEY);
    return null;
  }
}

export function storeOperatorSession(session: StoredOperatorSession) {
  const localStorage = getBrowserLocalStorage();
  if (!localStorage) {
    return;
  }

  localStorage.setItem(OPERATOR_SESSION_STORAGE_KEY, JSON.stringify({
    displayName: session.displayName,
    sessionToken: session.sessionToken,
  }));
  dispatchOperatorSessionChanged();
}

export function clearOperatorSession() {
  const localStorage = getBrowserLocalStorage();
  if (!localStorage) {
    return;
  }

  localStorage.removeItem(OPERATOR_SESSION_STORAGE_KEY);
  dispatchOperatorSessionChanged();
}
