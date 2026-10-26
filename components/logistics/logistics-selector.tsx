"use client";

/**
 * LogisticsSelector Component
 * Task 30.1: Display all partner options with cost comparison
 * Requirements: 8.1, 8.10
 */

import { useState, useEffect } from "react";
import { Check, Truck, Clock, DollarSign } from "lucide-react";
import type { ShippingQuote, GetQuotesRequest } from "@/lib/types/logistics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface LogisticsSelectorProps {
  orderId: string;
  quoteRequest: GetQuotesRequest;
  onSelect: (quote: ShippingQuote) => void;
  selectedQuoteId?: string;
}

export function LogisticsSelector({
  orderId,
  quoteRequest,
  onSelect,
  selectedQuoteId,
}: LogisticsSelectorProps) {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/logistics/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteRequest),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch shipping quotes");
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Select Logistics Partner</h3>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button
            onClick={fetchQuotes}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">
            No logistics partners available for this route.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find the cheapest quote
  const cheapestQuote = quotes.reduce((min, quote) =>
    quote.quotedPrice < min.quotedPrice ? quote : min,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Logistics Partner</h3>
        <Badge variant="secondary" className="text-xs">
          {quotes.length} options available
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {quotes.map((quote) => {
          const isSelected = selectedQuoteId === quote.id;
          const isCheapest = quote.id === cheapestQuote.id;

          return (
            <Card
              key={quote.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
              onClick={() => onSelect(quote)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">
                      {quote.providerName}
                    </CardTitle>
                  </div>
                  {isSelected && (
                    <Check
                      className="h-5 w-5 text-primary"
                      aria-label="Selected"
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Shipping Cost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      ₦{quote.quotedPrice.toLocaleString()}
                    </span>
                    {isCheapest && (
                      <Badge variant="default" className="text-xs">
                        Best Price
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Delivery Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Delivery Time</span>
                  </div>
                  <span className="text-sm font-medium">
                    {quote.estimatedDeliveryTime}
                  </span>
                </div>

                {/* Valid Until */}
                <div className="text-xs text-muted-foreground">
                  Quote valid until{" "}
                  {new Date(quote.validUntil).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cost Comparison Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price Range:</span>
            <span className="font-medium">
              ₦{Math.min(...quotes.map((q) => q.quotedPrice)).toLocaleString()}{" "}
              - ₦
              {Math.max(...quotes.map((q) => q.quotedPrice)).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
