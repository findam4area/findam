"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Eye, EyeOff, AlertTriangle } from "lucide-react";

interface PhoneRevealButtonProps {
  phone: string;
  listingId: string;
  sellerId: string;
}

// Rate limiting storage (in production, use server-side storage)
const revealHistory = new Map<string, { count: number; reset_at: number }>();

const MAX_REVEALS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

export function PhoneRevealButton({
  phone,
  listingId,
  sellerId,
}: PhoneRevealButtonProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const key = `phone_reveal_${sellerId}`;
    const history = revealHistory.get(key);

    if (!history || now > history.reset_at) {
      revealHistory.set(key, { count: 0, reset_at: now + RATE_LIMIT_WINDOW });
      return true;
    }

    return history.count < MAX_REVEALS_PER_HOUR;
  };

  const incrementRevealCount = () => {
    const key = `phone_reveal_${sellerId}`;
    const history = revealHistory.get(key);
    if (history) {
      history.count++;
    }
  };

  const handleReveal = async () => {
    setError(null);

    // Check rate limit
    if (!checkRateLimit()) {
      setError(
        "You've reached the maximum number of phone reveals for this hour. Please try again later.",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Log the reveal action
      const response = await fetch("/api/listings/reveal-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listing_id: listingId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reveal phone number");
      }

      incrementRevealCount();
      setIsRevealed(true);
    } catch (err) {
      console.error("Error revealing phone:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reveal phone number",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const maskPhone = (phone: string): string => {
    if (phone.length < 4) return "****";
    return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleReveal}
        disabled={isRevealed || isLoading}
        className="w-full gap-2"
        variant={isRevealed ? "outline" : "default"}
      >
        {isRevealed ? (
          <>
            <Eye className="h-4 w-4" />
            <Phone className="h-4 w-4" />
            <span className="font-mono">{phone}</span>
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4" />
            <Phone className="h-4 w-4" />
            <span className="font-mono">{maskPhone(phone)}</span>
            <span className="ml-2 text-xs opacity-70">Tap to Reveal</span>
          </>
        )}
      </Button>

      {isRevealed && (
        <p className="text-xs text-muted-foreground">
          ⚠️ Safety tip: Always meet in a public place and verify the item
          before making payment.
        </p>
      )}
    </div>
  );
}
