/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PageHeader from "@/components/common/PageHeader";

describe("PageHeader", () => {
  it("renders title and subtitle", () => {
    render(
      <PageHeader
        title="Explore"
        subtitle="Browse projects and builders."
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Explore" })).toBeInTheDocument();
    expect(screen.getByText("Browse projects and builders.")).toBeInTheDocument();
  });

  it("renders tab detail and actions", () => {
    render(
      <PageHeader
        title="Leaderboard"
        detail="Hackathon payout speeds"
        actions={<button type="button">Filter</button>}
      />,
    );
    expect(screen.getByText("Hackathon payout speeds")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
  });
});
