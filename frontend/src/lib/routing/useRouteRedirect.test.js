/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useRouteRedirect from "@/lib/routing/useRouteRedirect";

const replace = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    isReady: true,
    replace,
    query: {},
  }),
}));

describe("useRouteRedirect", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("replaces with a static target when the router is ready", async () => {
    renderHook(() => useRouteRedirect("/back?tab=agents"));
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/back?tab=agents");
    });
  });

  it("resolves dynamic targets from the router", async () => {
    renderHook(() =>
      useRouteRedirect((router) =>
        router.query.ids
          ? `/back?tab=agents&mode=compare&ids=${router.query.ids}`
          : "/back?tab=agents&mode=compare",
      ),
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/back?tab=agents&mode=compare");
    });
  });
});
