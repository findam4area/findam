"use client";

/**
 * Promo Code Input Component
 * Allows users to apply promo codes to subscription purchases
 * Requirements: 24.8
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Tag } from "lucide-react";
import { toast } from "sonner";

interface PromoCodeInputProps {
  plan: "pro" | "enterprise";
  originalPrice: number;
  onPromoApplied?: (promoCode: any, discountAmount: number) => void;
  onPromoRemoved?: () => void;
}

export function PromoCodeInput({
  plan,
  originalPrice,
  onPromoApplied,
  onPromoRemoved,
}: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    promo: any;
  } | null>(null);

  const handleApplyPromo = async () => {
    if (!code.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/subscription/promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          plan,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid promo code");
      }

      const { promo_code, discount } = await response.json();

      setAppliedPromo({
        code: promo_code.code,
        discount: discount,
        promo: promo_code,
      });

      const discountMessage = promo_code.discount_type === 'percentage' 
        ? `${promo_code.discount_value}% off applied!` 
        : `₦${promo_code.discount_value} off applied!`;
      toast.success(discountMessage);
      onPromoApplied?.(promo_code, discount);
    } catch (error) {
      console.error("Promo code validation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to validate promo code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setCode("");
    onPromoRemoved?.();
    toast.info("Promo code removed");
  };

  if (appliedPromo) {
    return (
      <div className="space-y-2">
        <Label>Promo Code Applied</Label>
        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                {appliedPromo.code}
              </p>
              <p className="text-xs text-green-700">
                You save ₦{appliedPromo.discount.toFixed(2)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemovePromo}
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        {appliedPromo.promo.duration_months > 1 && (
          <p className="text-xs text-muted-foreground">
            Discount applies for {appliedPromo.promo.duration_months} months
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="promo-code">
        Have a promo code? <span className="text-muted-foreground">(Optional)</span>
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="promo-code"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyPromo();
              }
            }}
            disabled={loading}
            className="pl-10"
            maxLength={20}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleApplyPromo}
          disabled={loading || !code.trim()}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Apply
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Promo codes can provide discounts on your subscription
      </p>
    </div>
  );
}
