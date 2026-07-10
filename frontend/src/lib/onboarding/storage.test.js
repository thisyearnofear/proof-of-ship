/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  ONBOARDING_KEYS,
  migrateLegacyOnboardingKeys,
  isTourDismissed,
  markTourDismissed,
} from "@/lib/onboarding/storage";

// vitest.setup.js mocks localStorage methods as disconnected vi.fn()s.
const store = new Map();

describe("onboarding storage", () => {
  beforeEach(() => {
    store.clear();
    localStorage.getItem.mockImplementation((k) => (store.has(k) ? store.get(k) : null));
    localStorage.setItem.mockImplementation((k, v) => {
      store.set(k, String(v));
    });
    localStorage.removeItem.mockImplementation((k) => {
      store.delete(k);
    });
    localStorage.clear.mockImplementation(() => {
      store.clear();
    });
  });

  it("migrates legacy tour key", () => {
    localStorage.setItem("hasSeenUnifiedOnboarding", "true");
    migrateLegacyOnboardingKeys();
    expect(isTourDismissed()).toBe(true);
    expect(localStorage.getItem("hasSeenUnifiedOnboarding")).toBeNull();
    expect(localStorage.getItem(ONBOARDING_KEYS.tour)).toBe("1");
  });

  it("marks tour dismissed", () => {
    markTourDismissed();
    expect(isTourDismissed()).toBe(true);
  });
});
