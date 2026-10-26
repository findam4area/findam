"use client";

/**
 * Subscription Actions Component
 * Handles subscription plan selection and payment
 * Requirements: 16.1, 16.7, 16.9
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionManager } from "@/components/subscription";
import type { SubscriptionPlan } from "@/lib/services/subscription";
import { toast } from "sonner";

interface SubscriptionActionsProps {
  currentPlan: SubscriptionPlan;
  userEmail: string;
}

export function SubscriptionActions({
  currentPlan,
  userEmail,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) {
      return;
    }

    if (plan === "basic") {
      // Handle downgrade to basic (cancellation)
      const confirmed = confirm(
        "Are you sure you want to downgrade to Basic? You'll lose access to premium features at the end of your billing period.",
      );
      if (!confirmed) return;

      setLoading(true);
      try {
        const response = await fetch("/api/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "User requested downgrade to Basic",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to cancel subscription");
        }

        toast.success(
          "Subscription cancelled. You'll have access until the end of your billing period.",
        );
        router.refresh();
      } catch (error) {
        console.error("Cancel subscription error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription",
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      if (currentPlan === "basic") {
        // Create new subscription
        const response = await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            callback_url: `${window.location.origin}/premium/success`,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create subscription");
        }

        const data = await response.json();

        // Redirect to Paystack payment page
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          toast.success("Subscription created successfully!");
          router.refresh();
        }
      } else {
        // Upgrade or downgrade existing subscription
        const planHierarchy: Record<SubscriptionPlan, number> = { 
          basic: 0, 
          pro: 1, 
          enterprise: 2 
        };
        const action =
          planHierarchy[plan] > planHierarchy[currentPlan]
            ? "upgrade"
            : "downgrade";

        const response = await fetch("/api/subscription", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            new_plan: plan,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update subscription");
        }

        toast.success(
          `Subscription ${action}d to ${plan.charAt(0).toUpperCase() + plan.slice(1)} successfully!`,
        );
        router.refresh();
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionManager
      currentPlan={currentPlan}
      onSelectPlan={handleSelectPlan}
      loading={loading}
    />
  );
}
