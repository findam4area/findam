"use client";

/**
 * Offer Comparison Component
 *
 * Displays offers side-by-side for comparison with accept/reject actions.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  DollarSign,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Star,
  Shield,
  Phone,
  Award,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Offer {
  id: string;
  price: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  users: {
    username: string;
    avatar_url: string | null;
    trust_score: number;
    phone_verified: boolean;
    nin_verified: boolean;
  };
  listings: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    condition: string;
    state: string;
    lga: string;
  } | null;
}

interface OfferComparisonProps {
  offers: Offer[];
  requestId: string;
  isRequester: boolean;
  onOfferUpdate?: () => void;
}

export function OfferComparison({
  offers,
  requestId,
  isRequester,
  onOfferUpdate,
}: OfferComparisonProps) {
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string>("");

  // Find the best offer (lowest price among pending offers)
  const pendingOffers = offers.filter((o) => o.status === "pending");
  const bestOffer =
    pendingOffers.length > 0
      ? pendingOffers.reduce((min, offer) =>
          offer.price < min.price ? offer : min,
        )
      : null;

  const handleOfferAction = async (
    offerId: string,
    action: "accept" | "reject",
  ) => {
    setError("");
    setProcessingOfferId(offerId);

    try {
      const response = await fetch(
        `/api/product-requests/${requestId}/offers/${offerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} offer`);
      }

      onOfferUpdate?.();
    } catch (err) {
      console.error(`Error ${action}ing offer:`, err);
      setError(
        err instanceof Error ? err.message : `Failed to ${action} offer`,
      );
    } finally {
      setProcessingOfferId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (offers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No offers yet</h3>
        <p className="text-muted-foreground">
          Sellers will be able to submit offers for this request
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Offers grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => {
          const isBestOffer = bestOffer?.id === offer.id;

          return (
            <Card
              key={offer.id}
              className={`p-6 space-y-4 ${
                isBestOffer ? "ring-2 ring-green-500 dark:ring-green-600" : ""
              }`}
            >
              {/* Best offer badge */}
              {isBestOffer && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                  <Award className="h-4 w-4" />
                  Best Offer
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                {getStatusBadge(offer.status)}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(offer.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {/* Seller info */}
              <div className="flex items-center gap-3">
                {offer.users.avatar_url ? (
                  <img
                    src={offer.users.avatar_url}
                    alt={offer.users.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{offer.users.username}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{offer.users.trust_score}</span>
                    </div>
                    {offer.users.phone_verified && (
                      <Phone className="h-3 w-3 text-green-600" />
                    )}
                    {offer.users.nin_verified && (
                      <Shield className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Offer Price</span>
                </div>
                <p className="text-2xl font-bold">
                  ₦{offer.price.toLocaleString()}
                </p>
              </div>

              {/* Listing details */}
              {offer.listings && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {offer.listings.thumbnail_url ? (
                      <img
                        src={offer.listings.thumbnail_url}
                        alt={offer.listings.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {offer.listings.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {offer.listings.condition}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {offer.listings.lga}, {offer.listings.state}
                    </span>
                  </div>
                </div>
              )}

              {/* Message */}
              {offer.message && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Message:
                  </p>
                  <p className="text-sm bg-muted/50 rounded p-3">
                    {offer.message}
                  </p>
                </div>
              )}

              {/* Actions (only for requester and pending offers) */}
              {isRequester && offer.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOfferAction(offer.id, "reject")}
                    disabled={processingOfferId === offer.id}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOfferAction(offer.id, "accept")}
                    disabled={processingOfferId === offer.id}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
