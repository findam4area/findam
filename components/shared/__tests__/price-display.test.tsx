import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriceDisplay } from "../price-display";

describe("PriceDisplay", () => {
  it("formats price with Naira symbol and commas", () => {
    render(<PriceDisplay amount={1500000} />);

    expect(screen.getByText(/₦1,500,000/)).toBeInTheDocument();
  });

  it("formats small amounts correctly", () => {
    render(<PriceDisplay amount={500} />);

    expect(screen.getByText(/₦500/)).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { container } = render(<PriceDisplay amount={1000} size="lg" />);

    const priceElement = container.querySelector("span");
    expect(priceElement).toHaveClass("text-xl");
  });

  it("applies custom className", () => {
    const { container } = render(
      <PriceDisplay amount={1000} className="custom-class" />,
    );

    const priceElement = container.querySelector("span");
    expect(priceElement).toHaveClass("custom-class");
  });

  it("uses JetBrains Mono font", () => {
    const { container } = render(<PriceDisplay amount={1000} />);

    const priceElement = container.querySelector("span");
    expect(priceElement).toHaveClass("font-mono");
  });

  it("hides currency symbol when showCurrency is false", () => {
    render(<PriceDisplay amount={1000} showCurrency={false} />);

    const text = screen.getByText(/1,000/);
    expect(text.textContent).not.toContain("₦");
  });

  it("formats zero correctly", () => {
    render(<PriceDisplay amount={0} />);

    expect(screen.getByText(/₦0/)).toBeInTheDocument();
  });

  it("formats large amounts correctly", () => {
    render(<PriceDisplay amount={50000000} />);

    expect(screen.getByText(/₦50,000,000/)).toBeInTheDocument();
  });
});
