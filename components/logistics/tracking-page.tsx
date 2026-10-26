"use client";

/**
 * TrackingPage Component
 * Comprehensive tracking page combining all logistics components
 * Tasks: 30.1, 30.3, 30.5, 30.10
 */

import { useState, useEffect } from "react";
import type { TrackingInfo } from "@/lib/types/logistics";
import { TrackingDashboard } from "./tracking-dashboard";
import { DeliveryTimeline } from "./delivery-timeline";
import { DeliveryRating } from "./delivery-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TrackingPageProps {
  shipmentId: string;
}

export function TrackingPage({ shipmentId }: TrackingPageProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackingInfo();
  }, [shipmentId]);

  const fetchTrackingInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/logistics/track/${shipmentId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tracking information");
      }

      const data = await response.json();
      setTrackingInfo(data.trackingInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !trackingInfo) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Unable to load tracking information"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { shipment, provider, history } = trackingInfo;
  const canRate = shipment.status === "delivered" && !shipment.deliveryRating;

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Main Tracking Dashboard */}
      <TrackingDashboard
        shipmentId={shipmentId}
        onRefresh={fetchTrackingInfo}
      />

      {/* Delivery Timeline */}
      <DeliveryTimeline currentStatus={shipment.status} history={history} />

      {/* Delivery Rating (only show if delivered and not yet rated) */}
      {canRate && (
        <DeliveryRating
          shipmentId={shipmentId}
          providerName={provider.name}
          onRatingSubmitted={fetchTrackingInfo}
        />
      )}

      {/* Show existing rating if already rated */}
      {shipment.deliveryRating && (
        <DeliveryRating
          shipmentId={shipmentId}
          providerName={provider.name}
          existingRating={shipment.deliveryRating}
          existingReview={shipment.deliveryReview}
        />
      )}
    </div>
  );
}
