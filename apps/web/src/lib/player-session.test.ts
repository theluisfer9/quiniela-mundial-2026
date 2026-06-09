import { afterEach, describe, expect, it } from "bun:test";

import {
  PLAYER_SESSION_CHANGED_EVENT,
  PLAYER_SESSION_STORAGE_KEY,
  clearPlayerSession,
  getStoredPlayerSession,
  subscribeToPlayerSessionChanges,
  storePlayerSession,
} from "./player-session";

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, "window");
}

function setWindow(value: unknown) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value,
  });
}

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

function createBrowserWindow() {
  const eventTarget = new EventTarget();

  return {
    localStorage: createMemoryStorage(),
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
  };
}

describe("player-session", () => {
  afterEach(() => {
    restoreWindow();
  });

  it("stores and reads the session token with cached display name", () => {
    const localStorage = createMemoryStorage();
    setWindow({ localStorage });

    storePlayerSession({ sessionToken: "token-123", displayName: "Luz" });


    expect(getStoredPlayerSession()).toEqual({ sessionToken: "token-123", displayName: "Luz" });
    expect(JSON.parse(localStorage.getItem(PLAYER_SESSION_STORAGE_KEY) ?? "{}"))
      .not.toHaveProperty("playerId");
  });

  it("exports a stable same-tab player session change event name", () => {
    expect(PLAYER_SESSION_CHANGED_EVENT).toBe("quiniela:player-session-changed");
  });

  it("notifies same-tab subscribers when the session is stored or cleared", () => {
    const window = createBrowserWindow();
    const events: Array<"changed"> = [];
    setWindow(window);

    const unsubscribe = subscribeToPlayerSessionChanges(() => events.push("changed"));

    storePlayerSession({ sessionToken: "token-123", displayName: "Luz" });
    clearPlayerSession();
    unsubscribe();
    storePlayerSession({ sessionToken: "token-456", displayName: "Ana" });

    expect(events).toEqual(["changed", "changed"]);
  });

  it("does not recursively notify when a subscriber reads the stored session", () => {
    const window = createBrowserWindow();
    let callCount = 0;
    setWindow(window);

    const unsubscribe = subscribeToPlayerSessionChanges(() => {
      callCount += 1;
      getStoredPlayerSession();
    });

    storePlayerSession({ sessionToken: "token-123", displayName: "Luz" });
    unsubscribe();

    expect(callCount).toBe(1);
  });

  it("does not notify same-tab subscribers when a read silently clears malformed storage", () => {
    const window = createBrowserWindow();
    const events: Array<"changed"> = [];
    setWindow(window);
    window.localStorage.setItem(PLAYER_SESSION_STORAGE_KEY, "not-json");

    const unsubscribe = subscribeToPlayerSessionChanges(() => events.push("changed"));

    expect(getStoredPlayerSession()).toBeNull();
    unsubscribe();

    expect(window.localStorage.getItem(PLAYER_SESSION_STORAGE_KEY)).toBeNull();
    expect(events).toEqual([]);
  });

  it("returns only session token and display name from stored values with extra fields", () => {
    const localStorage = createMemoryStorage();
    setWindow({ localStorage });
    localStorage.setItem(
      PLAYER_SESSION_STORAGE_KEY,
      JSON.stringify({ sessionToken: "token-123", displayName: "Luz", playerId: "abc" }),
    );

    expect(getStoredPlayerSession()).toEqual({ sessionToken: "token-123", displayName: "Luz" });
    expect(JSON.parse(localStorage.getItem(PLAYER_SESSION_STORAGE_KEY) ?? "{}"))
      .toEqual({ sessionToken: "token-123", displayName: "Luz" });
  });

  it("stores only session token and display name from session objects with extra fields", () => {
    const localStorage = createMemoryStorage();
    setWindow({ localStorage });

    storePlayerSession({ sessionToken: "token-123", displayName: "Luz", playerId: "abc" } as any);

    expect(JSON.parse(localStorage.getItem(PLAYER_SESSION_STORAGE_KEY) ?? "{}"))
      .toEqual({ sessionToken: "token-123", displayName: "Luz" });
  });

  it("returns null and clears malformed stored JSON", () => {
    const localStorage = createMemoryStorage();
    setWindow({ localStorage });
    localStorage.setItem(PLAYER_SESSION_STORAGE_KEY, "not-json");

    expect(getStoredPlayerSession()).toBeNull();
    expect(localStorage.getItem(PLAYER_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("returns null and clears incomplete stored values", () => {
    const localStorage = createMemoryStorage();
    setWindow({ localStorage });
    localStorage.setItem(PLAYER_SESSION_STORAGE_KEY, JSON.stringify({ sessionToken: "token-123" }));

    expect(getStoredPlayerSession()).toBeNull();
    expect(localStorage.getItem(PLAYER_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when localStorage access throws", () => {
    setWindow(
      Object.defineProperty({}, "localStorage", {
        get: () => {
          throw new Error("blocked");
        },
      }),
    );

    expect(() => storePlayerSession({ sessionToken: "token-123", displayName: "Luz" })).not.toThrow();
    expect(() => clearPlayerSession()).not.toThrow();
    expect(getStoredPlayerSession()).toBeNull();
  });

  it("does not throw when localStorage methods throw", () => {
    const localStorage = {
      getItem: () => {
        throw new Error("blocked get");
      },
      removeItem: () => {
        throw new Error("blocked remove");
      },
      setItem: () => {
        throw new Error("blocked set");
      },
    };
    setWindow({ localStorage });

    expect(() => storePlayerSession({ sessionToken: "token-123", displayName: "Luz" })).not.toThrow();
    expect(() => clearPlayerSession()).not.toThrow();
    expect(getStoredPlayerSession()).toBeNull();
  });

  it("does not throw when window is unavailable", () => {
    Reflect.deleteProperty(globalThis, "window");

    expect(() => storePlayerSession({ sessionToken: "token-123", displayName: "Luz" })).not.toThrow();
    expect(() => clearPlayerSession()).not.toThrow();
    expect(getStoredPlayerSession()).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    setWindow({});

    expect(() => storePlayerSession({ sessionToken: "token-123", displayName: "Luz" })).not.toThrow();
    expect(() => clearPlayerSession()).not.toThrow();
    expect(getStoredPlayerSession()).toBeNull();
  });

  it("clears the stored session", () => {
    const localStorage = createMemoryStorage();
    setWindow({ localStorage });
    storePlayerSession({ sessionToken: "token-123", displayName: "Luz" });

    clearPlayerSession();

    expect(getStoredPlayerSession()).toBeNull();
  });
});
