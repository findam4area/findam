"use client";

/**
 * PremiumUpgradeModal Component
 * Displays pricing tiers and subscription options for premium business listings
 * Requirements: 15.1, 15.3, 15.6
 * Tasks: 22.3
 */

import { useState } from "react";
import { Crown, Zap, Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessProfileId: string;
}

type PremiumTier = "basic" | "pro" | "enterprise";
type DurationMonths = 1 | 3 | 6 | 12;

interface PricingTier {
  id: PremiumTier;
  name: string;
  icon: typeof Crown;
  description: string;
  monthlyPrice: number;
  features: string[];
  highlighted?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    icon: Star,
    description: "Essential features to get started",
    monthlyPrice: 2999,
    features: [
      "Enhanced search placement",
      "Premium badge display",
      "Feature up to 3 products/services",
      "Basic analytics dashboard",
      "Priority customer support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    description: "Advanced features for growing businesses",
    monthlyPrice: 5999,
    features: [
      "Top search results placement",
      "Pro badge with custom styling",
      "Feature up to 10 products/services",
      "Advanced analytics & insights",
      "24/7 priority support",
      "Social media promotion",
      "Monthly performance reports",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Crown,
    description: "Maximum visibility for established businesses",
    monthlyPrice: 9999,
    features: [
      "Premium search placement",
      "Exclusive enterprise badge",
      "Unlimited featured products/services",
      "Comprehensive analytics suite",
      "Dedicated account manager",
      "Custom marketing campaigns",
      "API access & integrations",
      "Quarterly business reviews",
    ],
  },
];

const DURATION_OPTIONS: { months: DurationMonths; label: string; discount: number }[] = [
  { months: 1, label: "1 Month", discount: 0 },
  { months: 3, label: "3 Months", discount: 5 },
  { months: 6, label: "6 Months", discount: 10 },
  { months: 12, label: "12 Months", discount: 15 },
];

export function PremiumUpgradeModal({
  open,
  onOpenChange,
  businessProfileId,
}: PremiumUpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<PremiumTier>("pro");
  const [selectedDuration, setSelectedDuration] = useState<DurationMonths>(3);
  const [isLoading, setIsLoading] = useState(false);

  const selectedPricingTier = PRICING_TIERS.find((tier) => tier.id === selectedTier);
  const selectedDurationOption = DURATION_OPTIONS.find(
    (option) => option.months === selectedDuration,
  );

  const calculateTotal = () => {
    if (!selectedPricingTier || !selectedDurationOption) return 0;
    const subtotal = selectedPricingTier.monthlyPrice * selectedDuration;
    const discount = subtotal * (selectedDurationOption.discount / 100);
    return subtotal - discount;
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/business-profiles/${businessProfileId}/premium`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tier: selectedTier,
            duration_months: selectedDuration,
            payment_method: "paystack", // Default payment method
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to initiate premium upgrade");
      }

      const data = await response.json();

      // Redirect to payment URL
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (error) {
      console.error("Error upgrading to premium:", error);
      alert("Failed to initiate premium upgrade. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Boost your business visibility and unlock advanced features with a
            premium subscription.
          </DialogDescription>
        </DialogHeader>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {PRICING_TIERS.map((tier) => {
            const Icon = tier.icon;
            const isSelected = selectedTier === tier.id;

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-200 hover:border-primary/50",
                  tier.highlighted && "ring-2 ring-primary ring-offset-2",
                )}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {tier.description}
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    ₦{(tier.monthlyPrice / 100).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <h4 className="font-semibold">Subscription Duration</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DURATION_OPTIONS.map((option) => {
              const isSelected = selectedDuration === option.months;
              return (
                <button
                  key={option.months}
                  onClick={() => setSelectedDuration(option.months)}
                  className={cn(
                    "relative rounded-lg border-2 p-4 text-center transition-all hover:shadow-md",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50",
                  )}
                >
                  <div className="font-semibold">{option.label}</div>
                  {option.discount > 0 && (
                    <Badge
                      variant="outline"
                      className="absolute -top-2 -right-2 bg-green-100 text-green-700 border-green-300"
                    >
                      Save {option.discount}%
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Feature Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Feature</th>
                  <th className="text-center p-2 font-medium">Basic</th>
                  <th className="text-center p-2 font-medium">Pro</th>
                  <th className="text-center p-2 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Featured Products/Services</td>
                  <td className="text-center p-2">3</td>
                  <td className="text-center p-2">10</td>
                  <td className="text-center p-2">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Analytics Dashboard</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Advanced</td>
                  <td className="text-center p-2">Comprehensive</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Priority Support</td>
                  <td className="text-center p-2">
                    <Check className="h-4 w-4 inline text-green-600" />
                  </td>
                  <td className="text-center p-2">24/7</td>
                  <td className="text-center p-2">Dedicated Manager</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Marketing Campaigns</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">Social Media</td>
                  <td className="text-center p-2">Custom</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary and CTA */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">
                {selectedPricingTier?.name} Plan - {selectedDuration} Month
                {selectedDuration > 1 ? "s" : ""}
              </div>
              <div className="text-sm text-muted-foreground">
                ₦{selectedPricingTier && (selectedPricingTier.monthlyPrice / 100).toLocaleString()}/month × {selectedDuration} months
                {selectedDurationOption && selectedDurationOption.discount > 0 && (
                  <span className="text-green-600 ml-2">
                    ({selectedDurationOption.discount}% discount applied)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">
                ₦{(calculateTotal() / 100).toLocaleString()}
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Proceed to Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
