/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

const push = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/back",
    push,
  }),
}));

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    push.mockClear();
    document.body.innerHTML = '<input data-search-input aria-label="Discover search" />';
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses discover search on Cmd+K when already on Back", async () => {
    renderHook(() => useKeyboardShortcuts());
    const input = document.querySelector("[data-search-input]");

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );

    expect(push).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });
});
