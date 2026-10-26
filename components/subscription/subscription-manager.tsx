"use client";

/**
 * Subscription Manager Component
 * Displays subscription plan options and handles plan selection
 * Requirements: 16.1
 */

import { useState } from "react";
import { Check, Zap, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/lib/services/subscription";

interface PlanOption {
  id: SubscriptionPlan;
  name: string;
  price: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    description: "Perfect for getting started",
    icon: Shield,
    features: [
      "Up to 10 active listings",
      "Basic analytics",
      "Standard support",
      "3 saved searches",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 2999,
    description: "For growing sellers",
    icon: Zap,
    popular: true,
    features: [
      "Unlimited listings",
      "Advanced analytics & CSV export",
      "2 free boosts per month",
      "Unlimited saved searches",
      "Priority listing placement",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 5999,
    description: "For power sellers",
    icon: Crown,
    features: [
      "Everything in Pro",
      "5 free boosts per month",
      "Priority customer support",
      "Custom storefront domain",
      "Dedicated account manager",
      "Early access to new features",
    ],
  },
];

interface SubscriptionManagerProps {
  currentPlan?: SubscriptionPlan;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  loading?: boolean;
}

export function SubscriptionManager({
  currentPlan = "basic",
  onSelectPlan,
  loading = false,
}: SubscriptionManagerProps) {
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlan>(currentPlan);

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
    onSelectPlan(planId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful features to grow your business on FindAm. Start with a
          7-day free trial on Pro or Business plans.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const isSelected = selectedPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all duration-200 hover:shadow-lg",
                isSelected && "ring-2 ring-primary",
                plan.popular && "border-primary",
              )}
            >
              {plan.popular && (
                <Badge
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  variant="default"
                >
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-8 w-8 text-primary" />
                  {isCurrentPlan && (
                    <Badge variant="secondary">Current Plan</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">
                      ₦{plan.price.toLocaleString()}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground ml-2">/month</span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      7-day free trial included
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading || isCurrentPlan}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : isSelected
                      ? "Selected"
                      : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Compare All Features
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold">Feature</th>
                <th className="text-center py-4 px-4 font-semibold">Basic</th>
                <th className="text-center py-4 px-4 font-semibold">Pro</th>
                <th className="text-center py-4 px-4 font-semibold">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4 px-4">Active Listings</td>
                <td className="text-center py-4 px-4">10</td>
                <td className="text-center py-4 px-4">Unlimited</td>
                <td className="text-center py-4 px-4">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4">Advanced Analytics</td>
                <td className="text-center py-4 px-4">
                  <span className="text-muted-foreground">—</span>
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4">CSV Export</td>
                <td className="text-center py-4 px-4">
                  <span className="text-muted-foreground">—</span>
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4">Free Boosts per Month</td>
                <td className="text-center py-4 px-4">0</td>
                <td className="text-center py-4 px-4">2</td>
                <td className="text-center py-4 px-4">5</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4">Priority Support</td>
                <td className="text-center py-4 px-4">
                  <span className="text-muted-foreground">—</span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="text-muted-foreground">—</span>
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4">Custom Domain</td>
                <td className="text-center py-4 px-4">
                  <span className="text-muted-foreground">—</span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="text-muted-foreground">—</span>
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4">Saved Searches</td>
                <td className="text-center py-4 px-4">3</td>
                <td className="text-center py-4 px-4">Unlimited</td>
                <td className="text-center py-4 px-4">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <details className="group border rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              Can I cancel my subscription anytime?
            </summary>
            <p className="mt-2 text-muted-foreground">
              Yes, you can cancel your subscription at any time. You&apos;ll continue
              to have access to premium features until the end of your billing
              period.
            </p>
          </details>
          <details className="group border rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              What happens when my subscription expires?
            </summary>
            <p className="mt-2 text-muted-foreground">
              Your account will automatically downgrade to the Basic plan. Your
              listings will remain active, but you&apos;ll be limited to 10 active
              listings and lose access to premium features.
            </p>
          </details>
          <details className="group border rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              How does the 7-day free trial work?
            </summary>
            <p className="mt-2 text-muted-foreground">
              First-time Pro or Business subscribers get a 7-day free trial. You
              won&apos;t be charged until the trial ends. Cancel anytime during the
              trial with no charges.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
