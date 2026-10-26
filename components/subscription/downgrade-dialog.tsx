"use client";

/**
 * Subscription Downgrade Dialog Component
 * Allows users to downgrade subscription with prorated refund preview
 * Requirements: 24.9
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ArrowDown, Wallet } from "lucide-react";
import { toast } from "sonner";

interface DowngradeDialogProps {
  currentPlan: "pro" | "enterprise";
  newPlan: "basic" | "pro";
  onDowngraded?: () => void;
  trigger?: React.ReactNode;
}

export function DowngradeDialog({
  currentPlan,
  newPlan,
  onDowngraded,
  trigger,
}: DowngradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculatingRefund, setCalculatingRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | null>(null);
  const [refundMessage, setRefundMessage] = useState("");

  // Calculate refund when dialog opens
  useEffect(() => {
    if (open && refundAmount === null) {
      fetchRefundEstimate();
    }
  }, [open]);

  const fetchRefundEstimate = async () => {
    setCalculatingRefund(true);
    try {
      const response = await fetch(
        `/api/subscription/downgrade?new_plan=${newPlan}`,
      );

      if (!response.ok) {
        throw new Error("Failed to calculate refund");
      }

      const data = await response.json();
      setRefundAmount(data.refund_amount);
      setRefundMessage(data.message);
    } catch (error) {
      console.error("Refund calculation error:", error);
      toast.error("Failed to calculate refund estimate");
    } finally {
      setCalculatingRefund(false);
    }
  };

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscription/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_plan: newPlan,
          apply_refund: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to downgrade subscription");
      }

      const data = await response.json();
      toast.success(data.message);
      setOpen(false);
      onDowngraded?.();
    } catch (error) {
      console.error("Downgrade error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to downgrade subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  const planNames: Record<string, string> = {
    basic: "Basic",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ArrowDown className="h-4 w-4 mr-2" />
            Downgrade to {planNames[newPlan]}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Downgrade Subscription</DialogTitle>
          <DialogDescription>
            You are about to downgrade from {planNames[currentPlan]} to{" "}
            {planNames[newPlan]}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Refund Calculation */}
          {calculatingRefund ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Calculating refund...
              </span>
            </div>
          ) : refundAmount !== null ? (
            <Alert className="border-blue-200 bg-blue-50">
              <Wallet className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                {refundMessage}
                {refundAmount > 0 && (
                  <div className="mt-2 font-semibold text-lg">
                    ₦{refundAmount.toFixed(2)}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Warning About Feature Loss */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <div className="font-medium mb-1">Features you will lose:</div>
              <ul className="text-sm list-disc list-inside space-y-1">
                {currentPlan === "enterprise" && newPlan === "pro" && (
                  <>
                    <li>3 free boosts per month (Enterprise only)</li>
                    <li>Priority support</li>
                    <li>Custom domain</li>
                  </>
                )}
                {newPlan === "basic" && (
                  <>
                    <li>Unlimited listings (limited to 10)</li>
                    <li>Advanced analytics</li>
                    <li>CSV export</li>
                    <li>Free monthly boosts</li>
                    {currentPlan === "enterprise" && (
                      <>
                        <li>Priority support</li>
                        <li>Custom domain</li>
                      </>
                    )}
                  </>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Timing Information */}
          <p className="text-sm text-muted-foreground">
            {newPlan === "basic"
              ? "Your downgrade will take effect at the end of your current billing period. You will continue to have access to premium features until then."
              : "Your plan will be updated immediately."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDowngrade}
            disabled={loading || calculatingRefund}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Downgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
