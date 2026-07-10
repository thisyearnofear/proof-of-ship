import { describe, it, expect } from "vitest";
import {
  getLoginSteps,
  getSetupProgress,
  getNavbarSetupLabel,
  getPostLoginDestination,
} from "@/lib/onboarding/loginSteps";

describe("getLoginSteps", () => {
  it("starts with role selection", () => {
    const steps = getLoginSteps({
      role: null,
      currentUser: null,
      anyWalletConnected: false,
      linked: false,
    });
    expect(steps[0].status).toBe("active");
    expect(steps[0].id).toBe("role");
  });

  it("tracks builder github before wallet", () => {
    const steps = getLoginSteps({
      role: "builder",
      currentUser: null,
      anyWalletConnected: false,
      linked: false,
    });
    expect(steps.find((s) => s.id === "github")?.status).toBe("active");
    expect(steps.find((s) => s.id === "wallet")?.status).toBe("pending");
  });

  it("marks backer verify active after wallet connect", () => {
    const steps = getLoginSteps({
      role: "backer",
      currentUser: null,
      anyWalletConnected: true,
      linked: false,
    });
    expect(steps.find((s) => s.id === "verify")?.status).toBe("active");
  });
});

describe("getSetupProgress", () => {
  it("returns fractional label", () => {
    const steps = getLoginSteps({
      role: "backer",
      currentUser: null,
      anyWalletConnected: true,
      linked: false,
    });
    expect(getSetupProgress(steps).label).toMatch(/\d+\/3/);
  });
});

describe("getNavbarSetupLabel", () => {
  it("shows finish setup when wallet connected without auth", () => {
    expect(getNavbarSetupLabel({ hasAnyWallet: true, currentUser: null, linkedWallets: [] }))
      .toBe("Finish setup (1/3)");
  });

  it("returns null when authed", () => {
    expect(getNavbarSetupLabel({ hasAnyWallet: true, currentUser: { uid: "1" }, linkedWallets: [] }))
      .toBeNull();
  });
});

describe("getPostLoginDestination", () => {
  it("routes backers to discover tab", () => {
    expect(getPostLoginDestination("backer")).toBe("/back?tab=discover");
  });

  it("respects explicit redirect", () => {
    expect(getPostLoginDestination("builder", "/projects/new")).toBe("/projects/new");
  });
});
