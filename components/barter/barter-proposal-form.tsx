"use client";

/**
 * Barter Proposal Form Component
 *
 * Allows users to create exchange proposals for listings.
 * Features:
 * - Selection of offered listing from user's active listings
 * - Value difference calculation
 * - Cash adjustment input for partial exchanges
 *
 * Requirements: 12.3, 12.9, 12.10
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { barterService } from "@/lib/services/barter";
import { ArrowLeftRight, AlertCircle, CheckCircle } from "lucide-react";

interface BarterProposalFormProps {
  targetListingId: string;
  targetListingTitle: string;
  targetListingPrice: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UserListing {
  id: string;
  title: string;
  price: number | null;
  images: string[];
}

export function BarterProposalForm({
  targetListingId,
  targetListingTitle,
  targetListingPrice,
  onSuccess,
  onCancel,
}: BarterProposalFormProps) {
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [selectedListing, setSelectedListing] = useState<UserListing | null>(
    null,
  );
  const [cashAdjustment, setCashAdjustment] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);

  const supabase = createClient();

  // Fetch user's active listings
  useEffect(() => {
    async function fetchUserListings() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("listings")
          .select("id, title, price, thumbnail_url")
          .eq("user_id", user.id)
          .eq("status", "active")
          .neq("id", targetListingId); // Exclude the target listing

        if (error) throw error;

        // Map thumbnail_url to images array for compatibility
        const mappedData = (data || []).map((listing) => ({
          ...listing,
          images: listing.thumbnail_url ? [listing.thumbnail_url] : [],
        }));

        setUserListings(mappedData);
      } catch (err) {
        console.error("Error fetching user listings:", err);
        setError("Failed to load your listings");
      } finally {
        setLoadingListings(false);
      }
    }

    fetchUserListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetListingId]);

  // Update selected listing when selection changes
  useEffect(() => {
    const listing = userListings.find((l) => l.id === selectedListingId);
    setSelectedListing(listing || null);
  }, [selectedListingId, userListings]);

  // Calculate value difference (Requirement 12.9)
  const valueDifference = selectedListing
    ? targetListingPrice - (selectedListing.price || 0)
    : 0;

  // Calculate final balance with cash adjustment
  const finalBalance = valueDifference - cashAdjustment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedListingId) {
      setError("Please select a listing to offer");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to create a proposal");
        return;
      }

      const result = await barterService.createProposal({
        targetListingId,
        offeredListingId: selectedListingId,
        proposerId: user.id,
        message: message.trim() || undefined,
        cashAdjustment,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || "Failed to create proposal");
      }
    } catch (err) {
      console.error("Error creating proposal:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loadingListings) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading your listings...
        </div>
      </Card>
    );
  }

  if (userListings.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            You don&apos;t have any active listings to offer for exchange.
          </p>
          <Button onClick={onCancel} variant="outline">
            Close
          </Button>
        </div>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Proposal Sent!</h3>
          <p className="text-muted-foreground">
            Your exchange proposal has been sent to the seller.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Propose an Exchange</h3>
          <p className="text-sm text-muted-foreground">
            Offer one of your items in exchange for:{" "}
            <strong>{targetListingTitle}</strong>
          </p>
        </div>

        {/* Select offered listing */}
        <div className="space-y-2">
          <Label htmlFor="offered-listing">Your Item to Offer</Label>
          <select
            id="offered-listing"
            value={selectedListingId}
            onChange={(e) => setSelectedListingId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
            aria-label="Select your item to offer for exchange"
          >
            <option value="">Select a listing...</option>
            {userListings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.title} - ₦{(listing.price || 0).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Value difference display (Requirement 12.9) */}
        {selectedListing && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Their item value:</span>
              <span className="font-medium">
                ₦{targetListingPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your item value:</span>
              <span className="font-medium">
                ₦{(selectedListing.price || 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Value difference:</span>
              <span
                className={`font-semibold ${valueDifference > 0 ? "text-green-600" : valueDifference < 0 ? "text-red-600" : "text-muted-foreground"}`}
              >
                {valueDifference > 0 ? "+" : ""}₦
                {Math.abs(valueDifference).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Cash adjustment input (Requirement 12.10) */}
        {selectedListing && valueDifference !== 0 && (
          <div className="space-y-2">
            <Label htmlFor="cash-adjustment">
              Cash Adjustment (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                {valueDifference > 0 ? "You receive" : "You pay"}
              </span>
            </Label>
            <Input
              id="cash-adjustment"
              type="number"
              min="0"
              max={Math.abs(valueDifference)}
              value={cashAdjustment}
              onChange={(e) => setCashAdjustment(Number(e.target.value))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Offer to{" "}
              {valueDifference > 0
                ? "reduce the amount you receive"
                : "pay part of the difference"}{" "}
              to make the exchange fairer
            </p>
            {cashAdjustment > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Final balance:</span>
                  <span className="font-semibold">
                    {finalBalance > 0
                      ? "You receive"
                      : finalBalance < 0
                        ? "You pay"
                        : "Even exchange"}{" "}
                    {finalBalance !== 0 &&
                      `₦${Math.abs(finalBalance).toLocaleString()}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message (Optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message to explain your proposal..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/500
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedListingId}
            className="flex-1"
          >
            {loading ? "Sending..." : "Send Proposal"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
