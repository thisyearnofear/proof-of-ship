import { describe, it, expect } from "vitest";
import {
  CAPITAL_RAILS,
  getRailById,
  getRailStatus,
  isRailAvailable,
  isRailIntegrated,
  RAIL_STATUS_LABELS,
  CAPITAL_STACK_ANCHOR_ID,
  CAPITAL_STACK_HREF,
} from "@/config/capitalStack";

describe("CAPITAL_RAILS", () => {
  it("defines three rails in progression order", () => {
    expect(CAPITAL_RAILS.map((r) => r.id)).toEqual(["bags", "x402", "prize"]);
  });

  it("every rail has a display status label", () => {
    for (const rail of CAPITAL_RAILS) {
      expect(RAIL_STATUS_LABELS[rail.status]).toBeTruthy();
    }
  });
});

describe("getRailById", () => {
  it("returns rail metadata", () => {
    expect(getRailById("x402")?.title).toBe("x402 Credit Line");
  });
});

describe("getRailStatus", () => {
  it("marks bags as coming soon and credit rails as live", () => {
    expect(getRailStatus("bags")).toBe("coming_soon");
    expect(getRailStatus("x402")).toBe("live");
    expect(getRailStatus("prize")).toBe("live");
  });
});

describe("isRailIntegrated", () => {
  it("returns false for coming soon rails", () => {
    expect(isRailIntegrated("bags")).toBe(false);
    expect(isRailIntegrated("x402")).toBe(true);
  });

  it("treats beta as available", () => {
    expect(isRailAvailable("beta")).toBe(true);
    expect(isRailAvailable("coming_soon")).toBe(false);
  });
});

describe("capital stack deep links", () => {
  it("exposes a landing anchor href", () => {
    expect(CAPITAL_STACK_ANCHOR_ID).toBe("capital-stack");
    expect(CAPITAL_STACK_HREF).toBe("/#capital-stack");
  });
});
