"use client";

/**
 * Product Request Detail Page
 *
 * Displays a single product request with all its details and offers.
 * Allows requesters to mark as fulfilled and accept/reject offers.
 * Allows sellers to submit offers.
 *
 * Requirements: 19.3, 19.4, 19.5, 19.7, 19.8, 19.9, 19.10, 19.11, 19.12, 19.13
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  OfferSubmissionForm,
  OfferComparison,
} from "@/components/product-request";
import {
  ArrowLeft,
  Clock,
  MapPin,
  DollarSign,
  MessageSquare,
  CheckCircle,
  User,
  Star,
  Loader2,
  Package,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ProductRequest {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  status: "active" | "fulfilled" | "expired";
  offers_count: number;
  expires_at: string;
  fulfilled_at: string | null;
  created_at: string;
  user_id: string;
  users: {
    username: string;
    avatar_url: string | null;
    trust_score: number;
  };
  categories: {
    name: string;
  } | null;
}

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

export default function ProductRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<ProductRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [markingFulfilled, setMarkingFulfilled] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Unwrap params Promise
  useEffect(() => {
    params.then((p) => setRequestId(p.id));
  }, [params]);

  const isRequester = user?.id === request?.user_id;
  const canSubmitOffer = user && !isRequester && request?.status === "active";

  // Fetch request details
  useEffect(() => {
    if (!requestId) return;

    async function fetchRequest() {
      try {
        const response = await fetch(`/api/product-requests/${requestId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch request");
        }

        const data = await response.json();
        setRequest(data);
      } catch (err) {
        console.error("Error fetching request:", err);
        setError("Failed to load product request");
      } finally {
        setLoading(false);
      }
    }

    fetchRequest();
  }, [requestId]);

  // Fetch offers (only if user is authenticated)
  useEffect(() => {
    if (!user || !request || !requestId) return;

    async function fetchOffers() {
      try {
        const response = await fetch(
          `/api/product-requests/${requestId}/offers`,
        );

        if (response.ok) {
          const data = await response.json();
          setOffers(data.offers || []);
        }
      } catch (err) {
        console.error("Error fetching offers:", err);
      }
    }

    fetchOffers();
  }, [requestId, user, request]);

  const handleMarkFulfilled = async () => {
    if (
      !requestId ||
      !confirm("Are you sure you want to mark this request as fulfilled?")
    ) {
      return;
    }

    setMarkingFulfilled(true);

    try {
      const response = await fetch(`/api/product-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "mark_fulfilled" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark as fulfilled");
      }

      const data = await response.json();
      setRequest(data);
    } catch (err) {
      console.error("Error marking as fulfilled:", err);
      alert("Failed to mark request as fulfilled");
    } finally {
      setMarkingFulfilled(false);
    }
  };

  const handleOfferSubmitted = () => {
    setShowOfferForm(false);
    // Refresh offers
    window.location.reload();
  };

  const handleOfferUpdate = () => {
    // Refresh the page to get updated offers
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
        );
      case "fulfilled":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Fulfilled</Badge>
        );
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffInDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays < 1) return "Expires soon";
    if (diffInDays === 1) return "1 day left";
    return `${diffInDays} days left`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
          <p className="text-muted-foreground mb-4">
            {error || "This product request could not be found"}
          </p>
          <Link href="/product-requests">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Back button */}
        <Link href="/product-requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </Link>

        {/* Request Details */}
        <Card className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{request.title}</h1>
                {getStatusBadge(request.status)}
              </div>
              {request.categories && (
                <Badge variant="outline" className="mb-3">
                  {request.categories.name}
                </Badge>
              )}
            </div>

            {/* Actions */}
            {isRequester && request.status === "active" && (
              <Button
                onClick={handleMarkFulfilled}
                disabled={markingFulfilled}
                variant="outline"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {markingFulfilled ? "Marking..." : "Mark as Fulfilled"}
              </Button>
            )}

            {canSubmitOffer && !showOfferForm && (
              <Button onClick={() => setShowOfferForm(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Offer
              </Button>
            )}
          </div>

          {/* Requester info */}
          <div className="flex items-center gap-3 pb-4 border-b">
            {request.users.avatar_url ? (
              <img
                src={request.users.avatar_url}
                alt={request.users.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">{request.users.username}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{request.users.trust_score} Trust Score</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Budget */}
            {request.budget_min !== null && request.budget_max !== null && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Budget Range</span>
                </div>
                <p className="font-semibold">
                  ₦{request.budget_min.toLocaleString()} - ₦
                  {request.budget_max.toLocaleString()}
                </p>
              </div>
            )}

            {/* Location */}
            {request.preferred_location && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>Preferred Location</span>
                </div>
                <p className="font-semibold">{request.preferred_location}</p>
              </div>
            )}

            {/* Time remaining */}
            {request.status === "active" && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Time Remaining</span>
                </div>
                <p className="font-semibold">
                  {getTimeRemaining(request.expires_at)}
                </p>
              </div>
            )}

            {/* Offers count */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <MessageSquare className="h-4 w-4" />
                <span>Offers Received</span>
              </div>
              <p className="font-semibold">{request.offers_count}</p>
            </div>
          </div>

          {/* Posted date */}
          <div className="text-sm text-muted-foreground pt-4 border-t">
            Posted{" "}
            {formatDistanceToNow(new Date(request.created_at), {
              addSuffix: true,
            })}
            {request.fulfilled_at && (
              <>
                {" • "}
                Fulfilled{" "}
                {formatDistanceToNow(new Date(request.fulfilled_at), {
                  addSuffix: true,
                })}
              </>
            )}
          </div>
        </Card>

        {/* Offer Submission Form */}
        {showOfferForm && requestId && (
          <OfferSubmissionForm
            requestId={requestId}
            requestTitle={request.title}
            onSuccess={handleOfferSubmitted}
            onCancel={() => setShowOfferForm(false)}
          />
        )}

        {/* Offers Section */}
        {user && (isRequester || offers.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isRequester ? "Offers Received" : "Your Offers"}
              </h2>
              {isRequester && offers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {offers.filter((o) => o.status === "pending").length} pending
                </p>
              )}
            </div>

            {requestId && (
              <OfferComparison
                offers={offers}
                requestId={requestId}
                isRequester={isRequester}
                onOfferUpdate={handleOfferUpdate}
              />
            )}
          </div>
        )}

        {/* Guest message */}
        {!user && (
          <Card className="p-6 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Sign in to view offers
            </h3>
            <p className="text-muted-foreground mb-4">
              Create an account to submit offers or view offers on your requests
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/register">
                <Button>Create Account</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
