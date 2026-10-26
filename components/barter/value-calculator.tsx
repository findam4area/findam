"use client";

/**
 * Value Calculator Component
 *
 * Shows estimated value comparison between items in a barter exchange.
 * Displays value difference and helps users understand the exchange balance.
 *
 * Requirements: 12.9
 */

import { Card } from "@/components/ui/card";
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ValueCalculatorProps {
  item1: {
    title: string;
    price: number;
    image?: string;
  };
  item2: {
    title: string;
    price: number;
    image?: string;
  };
  cashAdjustment?: number;
  className?: string;
}

export function ValueCalculator({
  item1,
  item2,
  cashAdjustment = 0,
  className = "",
}: ValueCalculatorProps) {
  const valueDifference = item2.price - item1.price;
  const finalBalance = valueDifference - cashAdjustment;
  const percentageDifference =
    item1.price > 0 ? Math.abs((valueDifference / item1.price) * 100) : 0;

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Value Comparison</h3>

      {/* Items Comparison */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 mb-6">
        {/* Item 1 */}
        <div className="space-y-2">
          {item1.image && (
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={item1.image}
                alt={item1.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-sm font-medium truncate">{item1.title}</p>
            <p className="text-lg font-bold">₦{item1.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Exchange Icon */}
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Item 2 */}
        <div className="space-y-2">
          {item2.image && (
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={item2.image}
                alt={item2.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-sm font-medium truncate">{item2.title}</p>
            <p className="text-lg font-bold">₦{item2.price.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Value Analysis */}
      <div className="space-y-3 bg-muted/50 rounded-lg p-4">
        {/* Raw Value Difference */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Value difference:
          </span>
          <div className="flex items-center gap-2">
            {valueDifference > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : valueDifference < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={`font-semibold ${
                valueDifference > 0
                  ? "text-green-600"
                  : valueDifference < 0
                    ? "text-red-600"
                    : "text-muted-foreground"
              }`}
            >
              {valueDifference > 0 ? "+" : ""}₦
              {Math.abs(valueDifference).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Percentage Difference */}
        {percentageDifference > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Percentage difference:
            </span>
            <span className="font-medium">
              {percentageDifference.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Cash Adjustment */}
        {cashAdjustment > 0 && (
          <>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Cash adjustment:
              </span>
              <span className="font-medium">
                -₦{cashAdjustment.toLocaleString()}
              </span>
            </div>

            {/* Final Balance */}
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Final balance:</span>
              <span
                className={`font-bold ${
                  finalBalance > 0
                    ? "text-green-600"
                    : finalBalance < 0
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {finalBalance === 0 ? (
                  "Even exchange"
                ) : (
                  <>
                    {finalBalance > 0 ? "+" : ""}₦
                    {Math.abs(finalBalance).toLocaleString()}
                  </>
                )}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Exchange Fairness Indicator */}
      <div className="mt-4">
        {Math.abs(finalBalance) === 0 ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-400">
            ✓ This is an even exchange with balanced values
          </div>
        ) : Math.abs(finalBalance) < item1.price * 0.1 ? (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-400">
            ℹ This is a fairly balanced exchange (within 10% difference)
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400">
            ⚠ There&apos;s a significant value difference. Consider adding a cash
            adjustment.
          </div>
        )}
      </div>

      {/* Exchange Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        {finalBalance > 0 ? (
          <p>
            The person receiving <strong>{item2.title}</strong> would get an
            item worth{" "}
            <strong>₦{Math.abs(finalBalance).toLocaleString()}</strong> more.
          </p>
        ) : finalBalance < 0 ? (
          <p>
            The person receiving <strong>{item1.title}</strong> would get an
            item worth{" "}
            <strong>₦{Math.abs(finalBalance).toLocaleString()}</strong> more.
          </p>
        ) : (
          <p>Both items have equal value, making this a fair exchange.</p>
        )}
      </div>
    </Card>
  );
}
