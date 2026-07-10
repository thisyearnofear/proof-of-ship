/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CapitalStack from "@/components/sections/CapitalStack";
import {
  CAPITAL_RAILS,
  CAPITAL_STACK_ANCHOR_ID,
} from "@/config/capitalStack";

describe("CapitalStack", () => {
  it("renders a status pill for every rail", () => {
    render(<CapitalStack />);

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getAllByText("Live")).toHaveLength(2);
    for (const rail of CAPITAL_RAILS) {
      expect(screen.getByText(rail.title)).toBeInTheDocument();
    }
  });

  it("exposes the landing anchor id on the default variant", () => {
    const { container } = render(<CapitalStack />);
    expect(container.querySelector(`#${CAPITAL_STACK_ANCHOR_ID}`)).toBeTruthy();
  });

  it("omits the anchor id on compact variant", () => {
    const { container } = render(<CapitalStack variant="compact" showHeader={false} />);
    expect(container.querySelector(`#${CAPITAL_STACK_ANCHOR_ID}`)).toBeNull();
  });
});
