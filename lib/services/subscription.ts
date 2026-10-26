/**
 * Subscription Service
 * Handles subscription plan management, upgrades, downgrades, and Paystack integration
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10
 */

import { createClient } from "@/lib/supabase/server";

export type SubscriptionPlan = "basic" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial" | "grace_period";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  price: number;
  status: SubscriptionStatus;
  features: {
    unlimited_listings: boolean;
    advanced_analytics: boolean;
    priority_support: boolean;
    custom_domain: boolean;
    csv_export: boolean;
  };
  free_boosts_per_month: number;
  free_boosts_remaining: number;
  boosts_reset_at: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  paystack_subscription_code: string | null;
  paystack_customer_code: string | null;
  paystack_email_token: string | null;
  next_billing_date: string | null;
  last_billing_date: string | null;
  billing_cycle: "monthly" | "yearly";
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  // Grace period fields (Task 20.2)
  grace_period_start: string | null;
  grace_period_end: string | null;
  in_grace_period: boolean;
  // Promo code fields (Task 20.2)
  promo_code_id: string | null;
  discount_applied: number;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  maxListings: number | "unlimited";
  advancedAnalytics: boolean;
  csvExport: boolean;
  prioritySupport: boolean;
  freeBoosts: number;
  customDomain: boolean;
  savedSearches: number | "unlimited";
}

export const PLAN_DETAILS: Record<
  SubscriptionPlan,
  { price: number; features: PlanFeatures }
> = {
  basic: {
    price: 0,
    features: {
      maxListings: 10,
      advancedAnalytics: false,
      csvExport: false,
      prioritySupport: false,
      freeBoosts: 0,
      customDomain: false,
      savedSearches: 3,
    },
  },
  pro: {
    price: 2999,
    features: {
      maxListings: "unlimited",
      advancedAnalytics: true,
      csvExport: true,
      prioritySupport: false,
      freeBoosts: 2,
      customDomain: false,
      savedSearches: "unlimited",
    },
  },
  enterprise: {
    price: 5999,
    features: {
      maxListings: "unlimited",
      advancedAnalytics: true,
      csvExport: true,
      prioritySupport: true,
      freeBoosts: 5,
      customDomain: true,
      savedSearches: "unlimited",
    },
  },
};

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  applicable_plans: string[];
  valid_from: string;
  valid_until: string;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  duration_months: number;
  is_active: boolean;
}

export class SubscriptionService {
  /**
   * Get user's subscription
   * Requirements: 16.1
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return data as Subscription;
  }

  /**
   * Validate promo code
   * Requirements: 24.8
   */
  async validatePromoCode(
    code: string,
    userId: string,
    plan: SubscriptionPlan
  ): Promise<{ isValid: boolean; promo?: PromoCode; error?: string; discount?: number }> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .rpc('validate_promo_code', {
        p_code: code,
        p_user_id: userId,
        p_plan: plan
      });

    if (error) {
      return { isValid: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { isValid: false, error: 'Invalid promo code' };
    }

    const result = data[0];
    
    if (!result.is_valid) {
      return { isValid: false, error: result.error_message };
    }

    // Get full promo code details
    const { data: promoData, error: promoError } = await (supabase as any)
      .from('promo_codes')
      .select('*')
      .eq('id', result.promo_id)
      .single();

    if (promoError || !promoData) {
      return { isValid: false, error: 'Promo code details not found' };
    }

    // Calculate discount
    const planPrice = PLAN_DETAILS[plan].price;
    const { data: discountData } = await (supabase as any)
      .rpc('calculate_discount', {
        p_original_price: planPrice,
        p_discount_type: result.discount_type,
        p_discount_value: result.discount_value
      });

    return {
      isValid: true,
      promo: promoData as PromoCode,
      discount: discountData || 0
    };
  }

  /**
   * Apply promo code to subscription
   * Requirements: 24.8
   */
  async applyPromoCode(
    subscriptionId: string,
    promoCodeId: string,
    discountAmount: number,
    originalPrice: number
  ): Promise<void> {
    const supabase = await createClient();

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // Update subscription with promo code
    const { error: updateError } = await (supabase as any)
      .from('subscriptions')
      .update({
        promo_code_id: promoCodeId,
        discount_applied: discountAmount,
        price: finalPrice
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw new Error(`Failed to apply promo code: ${updateError.message}`);
    }

    // Record redemption
    const subscription = await (supabase as any)
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription.error) {
      await (supabase as any)
        .from('promo_code_redemptions')
        .insert({
          promo_code_id: promoCodeId,
          user_id: subscription.data.user_id,
          subscription_id: subscriptionId,
          discount_amount: discountAmount,
          original_price: originalPrice,
          final_price: finalPrice
        });

      // Increment usage count
      await (supabase as any)
        .rpc('increment', {
          table_name: 'promo_codes',
          row_id: promoCodeId,
          column_name: 'current_uses'
        })
        .catch(() => {
          // Fallback: manual increment
          (supabase as any)
            .from('promo_codes')
            .update({
              current_uses: (supabase as any).raw('current_uses + 1')
            })
            .eq('id', promoCodeId);
        });
    }
  }

  /**
   * Create a new subscription
   * Requirements: 16.7, 16.10
   */
  async createSubscription(params: {
    user_id: string;
    email: string;
    plan: "pro" | "enterprise";
    callback_url?: string;
  }): Promise<{ subscription: Subscription; authorization_url: string }> {
    const supabase = await createClient();

    // Check if user already has a subscription
    const existing = await this.getSubscription(params.user_id);
    if (existing && existing.status !== "expired") {
      throw new Error("User already has an active subscription");
    }

    const planDetails = PLAN_DETAILS[params.plan];
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const periodEnd = new Date(trialEnd.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days after trial

    // Create Paystack subscription plan if not exists
    const paystackPlanCode = await this.getOrCreatePaystackPlan(params.plan);

    // Initialize Paystack subscription
    const paystackResponse = await this.initializePaystackSubscription({
      email: params.email,
      plan_code: paystackPlanCode,
      callback_url: params.callback_url,
    });

    // Create subscription record
    const { data: subscription, error: createError } = await (supabase as any)
      .from("subscriptions")
      .insert({
        user_id: params.user_id,
        plan: params.plan,
        price: planDetails.price,
        status: "trial",
        features: {
          unlimited_listings: planDetails.features.maxListings === "unlimited",
          advanced_analytics: planDetails.features.advancedAnalytics,
          priority_support: planDetails.features.prioritySupport,
          custom_domain: planDetails.features.customDomain,
          csv_export: planDetails.features.csvExport,
        },
        free_boosts_per_month: planDetails.features.freeBoosts,
        free_boosts_remaining: planDetails.features.freeBoosts,
        boosts_reset_at: new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: trialEnd.toISOString(),
        paystack_subscription_code: paystackResponse.subscription_code,
        paystack_customer_code: paystackResponse.customer_code,
        paystack_email_token: paystackResponse.email_token,
        next_billing_date: trialEnd.toISOString(),
        billing_cycle: "monthly",
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create subscription: ${createError.message}`);
    }

    // Immediately activate premium features on user profile
    const { error: userUpdateError } = await (supabase as any)
      .from("users")
      .update({
        is_premium: true,
        premium_tier: params.plan,
        premium_expires_at: periodEnd.toISOString(),
      })
      .eq("id", params.user_id);

    if (userUpdateError) {
      console.error("Failed to update user premium status:", userUpdateError);
      // Don't throw error, subscription is still created
    }

    return {
      subscription: subscription as Subscription,
      authorization_url: paystackResponse.authorization_url,
    };
  }

  /**
   * Initialize Paystack subscription
   * Requirements: 16.7
   */
  private async initializePaystackSubscription(params: {
    email: string;
    plan_code: string;
    callback_url?: string;
  }): Promise<{
    authorization_url: string;
    subscription_code: string;
    customer_code: string;
    email_token: string;
  }> {
    const response = await fetch("https://api.paystack.co/subscription", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: params.email,
        plan: params.plan_code,
        start_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // Start after 7-day trial
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to initialize subscription");
    }

    const result = await response.json();
    return {
      authorization_url: result.data.authorization_url || result.data.link,
      subscription_code: result.data.subscription_code,
      customer_code: result.data.customer.customer_code,
      email_token: result.data.email_token,
    };
  }

  /**
   * Get or create Paystack plan
   * Requirements: 16.7
   */
  private async getOrCreatePaystackPlan(
    plan: "pro" | "enterprise",
  ): Promise<string> {
    const planDetails = PLAN_DETAILS[plan];
    const planName = `FindAm ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
    const planCode = `findam_${plan}_monthly`;

    // Try to fetch existing plan
    const fetchResponse = await fetch(
      `https://api.paystack.co/plan/${planCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    if (fetchResponse.ok) {
      return planCode;
    }

    // Create new plan
    const createResponse = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: planName,
        amount: planDetails.price * 100, // Convert to kobo
        interval: "monthly",
        currency: "NGN",
        plan_code: planCode,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || "Failed to create Paystack plan");
    }

    return planCode;
  }

  /**
   * Upgrade subscription plan
   * Requirements: 16.9
   */
  async upgradeSubscription(params: {
    user_id: string;
    new_plan: "pro" | "enterprise";
  }): Promise<Subscription> {
    const supabase = await createClient();

    const subscription = await this.getSubscription(params.user_id);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Validate upgrade path
    if (subscription.plan === "enterprise") {
      throw new Error("Already on highest plan");
    }
    if (subscription.plan === "pro" && params.new_plan === "pro") {
      throw new Error("Already on Pro plan");
    }

    const newPlanDetails = PLAN_DETAILS[params.new_plan];

    // Update subscription
    const { data: updated, error: updateError } = await (supabase as any)
      .from("subscriptions")
      .update({
        plan: params.new_plan,
        price: newPlanDetails.price,
        features: {
          unlimited_listings:
            newPlanDetails.features.maxListings === "unlimited",
          advanced_analytics: newPlanDetails.features.advancedAnalytics,
          priority_support: newPlanDetails.features.prioritySupport,
          custom_domain: newPlanDetails.features.customDomain,
          csv_export: newPlanDetails.features.csvExport,
        },
        free_boosts_per_month: newPlanDetails.features.freeBoosts,
        free_boosts_remaining: newPlanDetails.features.freeBoosts,
      })
      .eq("user_id", params.user_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to upgrade subscription: ${updateError.message}`);
    }

    // Ensure premium status is active on user profile
    const { error: userUpdateError } = await (supabase as any)
      .from("users")
      .update({
        is_premium: true,
        premium_tier: params.new_plan,
        premium_expires_at: updated.current_period_end,
      })
      .eq("id", params.user_id);

    if (userUpdateError) {
      console.error("Failed to update user premium status:", userUpdateError);
    }

    // TODO: Update Paystack subscription plan
    // This requires canceling old subscription and creating new one

    return updated as Subscription;
  }

  /**
   * Downgrade subscription plan
   * Requirements: 16.9, 24.9
   */
  async downgradeSubscription(params: {
    user_id: string;
    new_plan: "basic" | "pro";
    apply_refund?: boolean;
  }): Promise<{ subscription: Subscription; refund_amount?: number }> {
    const supabase = await createClient();

    const subscription = await this.getSubscription(params.user_id);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Validate downgrade path
    if (subscription.plan === "basic") {
      throw new Error("Already on Basic plan");
    }
    if (subscription.plan === "pro" && params.new_plan === "pro") {
      throw new Error("Already on Pro plan");
    }

    // Calculate prorated refund
    let refundAmount = 0;
    if (params.apply_refund !== false) {
      refundAmount = await this.calculateProratedRefund(params.user_id, params.new_plan);
    }

    const newPlanDetails = PLAN_DETAILS[params.new_plan];

    // Update subscription
    const { data: updated, error: updateError } = await (supabase as any)
      .from("subscriptions")
      .update({
        plan: params.new_plan,
        price: newPlanDetails.price,
        features: {
          unlimited_listings:
            newPlanDetails.features.maxListings === "unlimited",
          advanced_analytics: newPlanDetails.features.advancedAnalytics,
          priority_support: newPlanDetails.features.prioritySupport,
          custom_domain: newPlanDetails.features.customDomain,
          csv_export: newPlanDetails.features.csvExport,
        },
        free_boosts_per_month: newPlanDetails.features.freeBoosts,
        free_boosts_remaining: Math.min(
          subscription.free_boosts_remaining,
          newPlanDetails.features.freeBoosts,
        ),
        cancel_at_period_end: params.new_plan === "basic",
      })
      .eq("user_id", params.user_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(
        `Failed to downgrade subscription: ${updateError.message}`,
      );
    }

    // Update user premium status
    const { error: userUpdateError } = await (supabase as any)
      .from("users")
      .update({
        is_premium: params.new_plan !== "basic",
        premium_tier: params.new_plan,
        premium_expires_at:
          params.new_plan === "basic" ? null : updated.current_period_end,
      })
      .eq("id", params.user_id);

    if (userUpdateError) {
      console.error("Failed to update user premium status:", userUpdateError);
    }

    // If there's a refund amount, process it
    if (refundAmount > 0) {
      // Credit wallet with refund amount
      await (supabase as any)
        .from('wallets')
        .update({
          available_balance: (supabase as any).raw(`available_balance + ${refundAmount}`)
        })
        .eq('user_id', params.user_id);

      // Record transaction
      await (supabase as any)
        .from('wallet_transactions')
        .insert({
          wallet_id: (await (supabase as any)
            .from('wallets')
            .select('id')
            .eq('user_id', params.user_id)
            .single()).data?.id,
          type: 'credit',
          amount: refundAmount,
          description: `Prorated refund for downgrading from ${subscription.plan} to ${params.new_plan}`,
          status: 'completed'
        });
    }

    return {
      subscription: updated as Subscription,
      refund_amount: refundAmount > 0 ? refundAmount : undefined
    };
  }

  /**
   * Cancel subscription
   * Requirements: 16.9
   */
  async cancelSubscription(params: {
    user_id: string;
    reason?: string;
  }): Promise<Subscription> {
    const supabase = await createClient();

    const subscription = await this.getSubscription(params.user_id);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    if (subscription.plan === "basic") {
      throw new Error("Cannot cancel basic plan");
    }

    // Mark for cancellation at period end
    const { data: updated, error: updateError } = await (supabase as any)
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: params.reason || null,
      })
      .eq("user_id", params.user_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to cancel subscription: ${updateError.message}`);
    }

    // Note: Premium features remain active until period end
    // The cron job will revoke access when the period expires

    // TODO: Cancel Paystack subscription

    return updated as Subscription;
  }

  /**
   * Start grace period on subscription expiration
   * Requirements: 24.7
   */
  async startGracePeriod(userId: string): Promise<Subscription> {
    const supabase = await createClient();

    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Call database function to start grace period
    const { error: gracePeriodError } = await (supabase as any)
      .rpc('start_grace_period', { p_subscription_id: subscription.id });

    if (gracePeriodError) {
      throw new Error(`Failed to start grace period: ${gracePeriodError.message}`);
    }

    // Fetch updated subscription
    return this.getSubscription(userId) as Promise<Subscription>;
  }

  /**
   * End grace period and revoke access
   * Requirements: 24.7
   */
  async endGracePeriod(userId: string): Promise<Subscription> {
    const supabase = await createClient();

    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Call database function to end grace period
    const { error: endError } = await (supabase as any)
      .rpc('end_grace_period', { p_subscription_id: subscription.id });

    if (endError) {
      throw new Error(`Failed to end grace period: ${endError.message}`);
    }

    // Fetch updated subscription
    return this.getSubscription(userId) as Promise<Subscription>;
  }

  /**
   * Handle subscription expiration
   * Requirements: 16.8, 24.7
   */
  async handleExpiration(userId: string): Promise<Subscription> {
    const supabase = await createClient();

    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Check if already in grace period
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    
    if (now > periodEnd && !subscription.in_grace_period) {
      // Start grace period
      return this.startGracePeriod(userId);
    }

    // If grace period has ended, revoke access
    if (subscription.in_grace_period && subscription.grace_period_end) {
      const graceEnd = new Date(subscription.grace_period_end);
      if (now > graceEnd) {
        return this.endGracePeriod(userId);
      }
    }

    return subscription;
  }

  /**
   * Calculate prorated refund for downgrade
   * Requirements: 24.9
   */
  async calculateProratedRefund(
    userId: string,
    newPlan: SubscriptionPlan
  ): Promise<number> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      return 0;
    }

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const periodStart = new Date(subscription.current_period_start);

    // Calculate remaining days in billing period
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
      return 0;
    }

    // Calculate refund based on price difference
    const currentPlanPrice = subscription.price;
    const newPlanPrice = PLAN_DETAILS[newPlan].price;
    const priceDifference = currentPlanPrice - newPlanPrice;

    if (priceDifference <= 0) {
      return 0; // No refund for upgrades
    }

    // Prorated refund = (price difference) * (remaining days / total days)
    const proratedRefund = (priceDifference * remainingDays) / totalDays;

    return Math.round(proratedRefund * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Use a free boost
   * Requirements: 16.5
   */
  async useFreeBoost(userId: string): Promise<Subscription> {
    const supabase = await createClient();

    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    if (subscription.free_boosts_remaining <= 0) {
      throw new Error("No free boosts remaining");
    }

    const { data: updated, error: updateError } = await (supabase as any)
      .from("subscriptions")
      .update({
        free_boosts_remaining: subscription.free_boosts_remaining - 1,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to use free boost: ${updateError.message}`);
    }

    return updated as Subscription;
  }

  /**
   * Check if user has feature access
   * Requirements: 16.2, 16.3, 16.4, 16.6
   */
  async hasFeatureAccess(
    userId: string,
    feature: keyof PlanFeatures,
  ): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      return false;
    }

    const planDetails = PLAN_DETAILS[subscription.plan];
    const featureValue = planDetails.features[feature];

    if (typeof featureValue === "boolean") {
      return featureValue;
    }

    return featureValue !== 0;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
