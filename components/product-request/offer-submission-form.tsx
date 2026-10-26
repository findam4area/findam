"use client";

/**
 * Offer Submission Form Component
 *
 * Allows sellers to submit offers for product requests with existing listings or custom offers.
 * Requirements: 19.3
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertCircle, Package } from "lucide-react";

interface OfferSubmissionFormProps {
  requestId: string;
  requestTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UserListing {
  id: string;
  title: string;
  price: number | null;
  thumbnail_url: string | null;
}

export function OfferSubmissionForm({
  requestId,
  requestTitle,
  onSuccess,
  onCancel,
}: OfferSubmissionFormProps) {
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [selectedListing, setSelectedListing] = useState<UserListing | null>(
    null,
  );
  const [customPrice, setCustomPrice] = useState<string>("");
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
          .order("created_at", { ascending: false });

        if (error) throw error;

        setUserListings(data || []);
      } catch (err) {
        console.error("Error fetching user listings:", err);
        setError("Failed to load your listings");
      } finally {
        setLoadingListings(false);
      }
    }

    fetchUserListings();
  }, [supabase]);

  // Update selected listing when selection changes
  useEffect(() => {
    const listing = userListings.find((l) => l.id === selectedListingId);
    setSelectedListing(listing || null);
    if (listing && listing.price !== null) {
      setCustomPrice(listing.price.toString());
    }
  }, [selectedListingId, userListings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const price = parseFloat(customPrice);

    if (isNaN(price) || price < 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to submit an offer");
        return;
      }

      const response = await fetch(
        `/api/product-requests/${requestId}/offers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listing_id: selectedListingId || undefined,
            price,
            message: message.trim() || undefined,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit offer");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error("Error submitting offer:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
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

  if (success) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Offer Submitted!</h3>
          <p className="text-muted-foreground">
            Your offer has been sent to the buyer. They will be notified and can
            review your offer.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Submit Your Offer</h3>
          <p className="text-sm text-muted-foreground">
            Offer a product for: <strong>{requestTitle}</strong>
          </p>
        </div>

        {/* Select existing listing (optional) */}
        {userListings.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="listing">
              Select from Your Listings (Optional)
            </Label>
            <select
              id="listing"
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Select your listing to offer"
            >
              <option value="">Custom offer (no listing)</option>
              {userListings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title} - ₦{listing.price?.toLocaleString() ?? "0"}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Choose an existing listing or create a custom offer
            </p>
          </div>
        )}

        {/* Selected listing preview */}
        {selectedListing && (
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
            {selectedListing.thumbnail_url ? (
              <img
                src={selectedListing.thumbnail_url}
                alt={selectedListing.title}
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedListing.title}</p>
              <p className="text-sm text-muted-foreground">
                ₦{selectedListing.price?.toLocaleString() ?? "0"}
              </p>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">
            Your Offer Price (₦) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder="Enter your offer price"
            min="0"
            step="100"
            required
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground">
            {selectedListing
              ? "You can adjust the price from your listing"
              : "Enter the price for your custom offer"}
          </p>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message (Optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add details about your offer, condition, availability, etc."
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/1000
          </p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Before submitting:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  Make sure your offer matches what the buyer is looking for
                </li>
                <li>Be honest about the condition and specifications</li>
                <li>The buyer will be notified of your offer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Submitting..." : "Submit Offer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
