/**
 * Boost Purchase Flow Component
 * Displays package options and handles payment flow
 * Requirements: 14.1, 14.4, 14.5
 * Task: 34.10
 */

"use client";

import { useState } from "react";
import { Check, Zap, TrendingUp, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getBoostPackageDetails } from "@/lib/types";
import type { BoostPackage } from "@/lib/types";

interface BoostPurchaseFlowProps {
  listingId: string;
  listingTitle: string;
  onPurchaseComplete?: () => void;
}

export function BoostPurchaseFlow({
  listingId,
  listingTitle,
  onPurchaseComplete,
}: BoostPurchaseFlowProps) {
  const [selectedPackage, setSelectedPackage] = useState<
    "basic" | "standard" | "premium"
  >("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packages: BoostPackage[] = [
    getBoostPackageDetails("basic"),
    getBoostPackageDetails("standard"),
    getBoostPackageDetails("premium"),
  ];

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/boosts/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_id: listingId,
          package_type: selectedPackage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to purchase boost");
      }

      const data = await response.json();

      // Redirect to Paystack payment page
      window.location.href = data.payment_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase boost");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Boost Your Listing</h2>
        <p className="mt-2 text-muted-foreground">
          Get more visibility for &quot;{listingTitle}&quot;
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pkg) => {
          const isSelected = selectedPackage === pkg.id;
          const isPopular = pkg.id === "standard";

          return (
            <Card
              key={pkg.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                isSelected && "border-primary ring-2 ring-primary",
              )}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pkg.name}</span>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    ₦{pkg.price.toLocaleString()}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>{pkg.duration} hours</span>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-4 w-4 text-primary" />
                  <span>~{pkg.estimatedViews.toLocaleString()} views</span>
                </div>

                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handlePurchase}
          disabled={isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? (
            "Processing..."
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              Purchase Boost
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
        <MessageCircle className="mx-auto mb-2 h-5 w-5" />
        <p>
          Your listing will appear at the top of search results and category
          feeds during the boost period.
        </p>
      </div>
    </div>
  );
}
