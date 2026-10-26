/**
 * Premium Subscription Page
 * Displays subscription plans and allows users to subscribe
 * Requirements: 16.1
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { subscriptionService } from "@/lib/services/subscription";
import { SubscriptionManager } from "@/components/subscription";
import { SubscriptionActions } from "./subscription-actions";

export const metadata: Metadata = {
  title: "Premium Plans | FindAm",
  description:
    "Upgrade to Pro or Business plan to unlock unlimited listings, advanced analytics, and more premium features.",
};

export default async function PremiumPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/premium");
  }

  // Get current subscription
  const subscription = await subscriptionService.getSubscription(user.id);
  const currentPlan = subscription?.plan || "basic";

  return (
    <div className="min-h-screen bg-background">
      <SubscriptionActions currentPlan={currentPlan} userEmail={user.email!} />
    </div>
  );
}
