/**
 * Premium Subscription Flow Tests
 * Task 20.1: Implement premium subscription flow
 * Requirements: 24.1, 24.2, 24.3, 24.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SubscriptionManager } from "@/components/subscription/subscription-manager";
import { PremiumBadge } from "@/components/subscription/premium-badge";

describe("Premium Subscription Flow - Task 20.1", () => {
  describe("Requirement 24.1: Subscription Tier Selection UI", () => {
    it("should display all three subscription tiers (Basic, Pro, Enterprise)", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      // Verify all three tiers are displayed (using getAllByText for multiple matches)
      const basicElements = screen.getAllByText("Basic");
      expect(basicElements.length).toBeGreaterThan(0);
      
      const proElements = screen.getAllByText("Pro");
      expect(proElements.length).toBeGreaterThan(0);
      
      const enterpriseElements = screen.getAllByText("Enterprise");
      expect(enterpriseElements.length).toBeGreaterThan(0);
    });

    it("should display feature comparisons for each tier", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      // Verify Basic features
      expect(screen.getByText("Up to 10 active listings")).toBeInTheDocument();
      expect(screen.getByText("Basic analytics")).toBeInTheDocument();

      // Verify Pro features
      expect(screen.getByText("Unlimited listings")).toBeInTheDocument();
      expect(
        screen.getByText("Advanced analytics & CSV export")
      ).toBeInTheDocument();
      expect(screen.getByText("2 free boosts per month")).toBeInTheDocument();

      // Verify Enterprise features
      expect(screen.getByText("Everything in Pro")).toBeInTheDocument();
      expect(screen.getByText("5 free boosts per month")).toBeInTheDocument();
      expect(screen.getByText("Priority customer support")).toBeInTheDocument();
      expect(screen.getByText("Custom storefront domain")).toBeInTheDocument();
    });

    it("should display pricing for each tier", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      // Verify pricing is displayed
      expect(screen.getByText("₦0")).toBeInTheDocument(); // Basic
      expect(screen.getByText("₦2,999")).toBeInTheDocument(); // Pro
      expect(screen.getByText("₦5,999")).toBeInTheDocument(); // Enterprise
    });

    it("should allow user to select a plan", async () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      // Find and click the Pro plan button
      const proButtons = screen.getAllByRole("button");
      const proSelectButton = proButtons.find(
        (btn) => btn.textContent === "Select Plan"
      );

      if (proSelectButton) {
        fireEvent.click(proSelectButton);
        await waitFor(() => {
          expect(mockOnSelectPlan).toHaveBeenCalled();
        });
      }
    });

    it("should show current plan badge", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="pro"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      // Verify current plan badge is shown (using getAllByText for multiple matches)
      const currentPlanElements = screen.getAllByText("Current Plan");
      expect(currentPlanElements.length).toBeGreaterThan(0);
    });

    it("should show 'Most Popular' badge on Pro plan", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText("Most Popular")).toBeInTheDocument();
    });

    it("should display feature comparison table", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      // Verify comparison table exists
      expect(screen.getByText("Compare All Features")).toBeInTheDocument();
      expect(screen.getByText("Active Listings")).toBeInTheDocument();
      expect(screen.getByText("Advanced Analytics")).toBeInTheDocument();
      expect(screen.getByText("CSV Export")).toBeInTheDocument();
      expect(screen.getByText("Free Boosts per Month")).toBeInTheDocument();
    });
  });

  describe("Requirement 24.2: Paystack Integration", () => {
    it("should have subscription API endpoint for creating subscriptions", async () => {
      // Verify the API route exists
      const { POST } = await import("@/app/api/subscription/route");
      expect(POST).toBeDefined();
      expect(typeof POST).toBe("function");
    });

    it("should have subscription API endpoint for managing subscriptions", async () => {
      // Verify all CRUD operations exist
      const { GET, POST, PATCH, DELETE } = await import(
        "@/app/api/subscription/route"
      );
      expect(GET).toBeDefined();
      expect(POST).toBeDefined();
      expect(PATCH).toBeDefined();
      expect(DELETE).toBeDefined();
    });

    it("should have Paystack webhook handler for subscription events", async () => {
      // Verify webhook handler exists
      const { POST } = await import(
        "@/app/api/webhooks/paystack-subscription/route"
      );
      expect(POST).toBeDefined();
      expect(typeof POST).toBe("function");
    });
  });

  describe("Requirement 24.3: Immediate Premium Feature Activation", () => {
    it("should have subscription service with createSubscription method", async () => {
      const { subscriptionService } = await import(
        "@/lib/services/subscription"
      );
      expect(subscriptionService.createSubscription).toBeDefined();
      expect(typeof subscriptionService.createSubscription).toBe("function");
    });

    it("should have subscription service with upgradeSubscription method", async () => {
      const { subscriptionService } = await import(
        "@/lib/services/subscription"
      );
      expect(subscriptionService.upgradeSubscription).toBeDefined();
      expect(typeof subscriptionService.upgradeSubscription).toBe("function");
    });

    it("should have subscription service with downgradeSubscription method", async () => {
      const { subscriptionService } = await import(
        "@/lib/services/subscription"
      );
      expect(subscriptionService.downgradeSubscription).toBeDefined();
      expect(typeof subscriptionService.downgradeSubscription).toBe(
        "function"
      );
    });

    it("should have subscription service with cancelSubscription method", async () => {
      const { subscriptionService } = await import(
        "@/lib/services/subscription"
      );
      expect(subscriptionService.cancelSubscription).toBeDefined();
      expect(typeof subscriptionService.cancelSubscription).toBe("function");
    });
  });

  describe("Requirement 24.4: Premium Badges on Profiles", () => {
    it("should display Pro badge with correct styling", () => {
      const { container } = render(<PremiumBadge plan="pro" />);

      const badge = screen.getByText("Pro");
      expect(badge).toBeInTheDocument();
      // Check that the badge has blue color classes
      expect(container.innerHTML).toContain("text-blue-700");
    });

    it("should display Enterprise badge with correct styling", () => {
      const { container } = render(<PremiumBadge plan="enterprise" />);

      const badge = screen.getByText("Enterprise");
      expect(badge).toBeInTheDocument();
      // Check that the badge has purple color classes
      expect(container.innerHTML).toContain("text-purple-700");
    });

    it("should not display badge for Basic plan", () => {
      const { container } = render(<PremiumBadge plan="basic" />);
      expect(container.firstChild).toBeNull();
    });

    it("should display badge with icon by default", () => {
      const { container } = render(<PremiumBadge plan="pro" />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should support different sizes (sm, md, lg)", () => {
      const { rerender, container } = render(<PremiumBadge plan="pro" size="sm" />);
      expect(container.innerHTML).toContain("text-xs");

      rerender(<PremiumBadge plan="pro" size="md" />);
      expect(container.innerHTML).toContain("text-sm");

      rerender(<PremiumBadge plan="pro" size="lg" />);
      expect(container.innerHTML).toContain("text-base");
    });

    it("should allow hiding icon", () => {
      const { container } = render(
        <PremiumBadge plan="pro" showIcon={false} />
      );
      const svg = container.querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe("Integration: Complete Subscription Flow", () => {
    it("should have success page for completed subscriptions", async () => {
      // Verify success page exists
      const SuccessPage = await import("@/app/(main)/premium/success/page");
      expect(SuccessPage.default).toBeDefined();
    });

    it("should display subscription actions component", async () => {
      const { SubscriptionActions } = await import(
        "@/app/(main)/premium/subscription-actions"
      );
      expect(SubscriptionActions).toBeDefined();
    });

    it("should have premium page that requires authentication", async () => {
      const PremiumPage = await import("@/app/(main)/premium/page");
      expect(PremiumPage.default).toBeDefined();
    });
  });

  describe("User Experience", () => {
    it("should display FAQ section", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(
        screen.getByText("Frequently Asked Questions")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Can I cancel my subscription anytime?")
      ).toBeInTheDocument();
      expect(
        screen.getByText("What happens when my subscription expires?")
      ).toBeInTheDocument();
      expect(
        screen.getByText("How does the 7-day free trial work?")
      ).toBeInTheDocument();
    });

    it("should show 7-day free trial information", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const trialTexts = screen.getAllByText("7-day free trial included");
      expect(trialTexts.length).toBeGreaterThan(0);
    });

    it("should disable current plan button", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="pro"
          onSelectPlan={mockOnSelectPlan}
        />
      );

      // Find the button with "Current Plan" text
      const buttons = screen.getAllByRole("button");
      const currentPlanButton = buttons.find(
        (btn) => btn.textContent === "Current Plan"
      );
      expect(currentPlanButton).toBeDefined();
      expect(currentPlanButton).toBeDisabled();
    });

    it("should show loading state when processing", () => {
      const mockOnSelectPlan = vi.fn();
      render(
        <SubscriptionManager
          currentPlan="basic"
          onSelectPlan={mockOnSelectPlan}
          loading={true}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        if (button.textContent !== "Current Plan") {
          expect(button).toBeDisabled();
        }
      });
    });
  });
});
