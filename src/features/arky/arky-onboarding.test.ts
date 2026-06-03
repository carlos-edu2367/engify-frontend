import { describe, expect, it } from "vitest";
import {
  getArkyOnboardingStorageKey,
  hasSeenArkyOnboarding,
  markArkyOnboardingSeen,
} from "./arky-onboarding";

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => Array.from(items.keys())[index] ?? null,
    removeItem: (key) => items.delete(key),
    setItem: (key, value) => items.set(key, value),
  };
}

describe("arky onboarding storage", () => {
  it("uses a user-scoped key when a user id is available", () => {
    expect(getArkyOnboardingStorageKey("user-123")).toBe(
      "engify:arky-onboarding:v1:user:user-123"
    );
  });

  it("uses a browser-scoped fallback key without a user id", () => {
    expect(getArkyOnboardingStorageKey()).toBe("engify:arky-onboarding:v1:browser");
  });

  it("marks the onboarding as seen in storage", () => {
    const storage = createMemoryStorage();

    expect(hasSeenArkyOnboarding(storage, "user-123")).toBe(false);

    markArkyOnboardingSeen(storage, "user-123");

    expect(hasSeenArkyOnboarding(storage, "user-123")).toBe(true);
  });
});
