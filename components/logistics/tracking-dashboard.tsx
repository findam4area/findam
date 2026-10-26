"use client";

/**
 * TrackingDashboard Component
 * Task 30.3: Display real-time tracking status and estimated delivery time
 * Requirements: 8.3, 8.5
 */

import { useState, useEffect } from "react";
import { Package, MapPin, Clock, Phone, AlertCircle } from "lucide-react";
import type { TrackingInfo, ShipmentStatus } from "@/lib/types/logistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TrackingDashboardProps {
  shipmentId: string;
  onRefresh?: () => void;
}

const statusConfig: Record<
  ShipmentStatus,
  {
    label: string;
    color: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: {
    label: "Pending Pickup",
    color: "text-gray-500",
    variant: "secondary",
  },
  picked_up: { label: "Picked Up", color: "text-blue-500", variant: "default" },
  in_transit: {
    label: "In Transit",
    color: "text-blue-600",
    variant: "default",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "text-orange-500",
    variant: "default",
  },
  delivered: {
    label: "Delivered",
    color: "text-green-600",
    variant: "default",
  },
  failed: {
    label: "Delivery Failed",
    color: "text-red-600",
    variant: "destructive",
  },
};

export function TrackingDashboard({
  shipmentId,
  onRefresh,
}: TrackingDashboardProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrackingInfo();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchTrackingInfo, 30000);
    return () => clearInterval(interval);
  }, [shipmentId]);

  const fetchTrackingInfo = async () => {
    try {
      setError(null);
      if (!loading) setRefreshing(true);

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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTrackingInfo();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !trackingInfo) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "Unable to load tracking information"}
        </AlertDescription>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Retry
        </Button>
      </Alert>
    );
  }

  const { shipment, provider, history } = trackingInfo;
  const statusInfo = statusConfig[shipment.status];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tracking: {shipment.trackingNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                via {provider.name}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? "Updating..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge variant={statusInfo.variant} className="text-sm">
                {statusInfo.label}
              </Badge>
            </div>
            <Package className={`h-8 w-8 ${statusInfo.color}`} />
          </div>

          {/* Current Location */}
          {shipment.currentLocation && (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Location</p>
                <p className="text-sm text-muted-foreground">
                  {shipment.currentLocation}
                </p>
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          {shipment.estimatedDelivery && shipment.status !== "delivered" && (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(shipment.estimatedDelivery).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Actual Delivery */}
          {shipment.actualDelivery && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <Clock className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900">
                  Delivered On
                </p>
                <p className="text-sm text-green-700">
                  {new Date(shipment.actualDelivery).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Delivery Person Contact (when out for delivery) */}
          {shipment.status === "out_for_delivery" &&
            shipment.deliveryPerson && (
              <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <Phone className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-orange-900">
                    Delivery Person
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-orange-700">
                      {shipment.deliveryPerson.name}
                    </p>
                    <a
                      href={`tel:${shipment.deliveryPerson.phone}`}
                      className="text-sm font-medium text-orange-600 hover:underline"
                    >
                      {shipment.deliveryPerson.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}

          {/* Delivery Failure */}
          {shipment.status === "failed" && shipment.failureReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Delivery Failed</p>
                <p className="text-sm mt-1">{shipment.failureReason}</p>
                {shipment.failureTimestamp && (
                  <p className="text-xs mt-1">
                    Failed at:{" "}
                    {new Date(shipment.failureTimestamp).toLocaleString()}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Delivery Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">From</p>
            <p className="text-sm text-muted-foreground">
              {shipment.pickupAddress.street}, {shipment.pickupAddress.city},{" "}
              {shipment.pickupAddress.state}
            </p>
            <p className="text-xs text-muted-foreground">
              Contact: {shipment.pickupAddress.contactName} (
              {shipment.pickupAddress.contactPhone})
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium">To</p>
            <p className="text-sm text-muted-foreground">
              {shipment.deliveryAddress.street}, {shipment.deliveryAddress.city}
              , {shipment.deliveryAddress.state}
            </p>
            <p className="text-xs text-muted-foreground">
              Contact: {shipment.deliveryAddress.contactName} (
              {shipment.deliveryAddress.contactPhone})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
