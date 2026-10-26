"use client";

/**
 * Meetup Coordinator Component
 * Displays safe location suggestions and handles meetup scheduling
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Calendar,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface SafeLocation {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_from_buyer?: number;
  distance_from_seller?: number;
}

interface MeetupCoordinatorProps {
  transactionId: string;
  buyerId: string;
  sellerId: string;
  buyerLocation?: { lat: number; lng: number };
  sellerLocation?: { lat: number; lng: number };
  onScheduled?: (meetupId: string) => void;
}

export function MeetupCoordinator({
  transactionId,
  buyerId,
  sellerId,
  buyerLocation,
  sellerLocation,
  onScheduled,
}: MeetupCoordinatorProps) {
  const [safeLocations, setSafeLocations] = useState<SafeLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SafeLocation | null>(
    null,
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [safetyTips, setSafetyTips] = useState<string[]>([]);
  const [safetyTipsAcknowledged, setSafetyTipsAcknowledged] = useState(false);

  useEffect(() => {
    if (buyerLocation && sellerLocation) {
      fetchSafeLocations();
    }
    fetchSafetyTips();
  }, [buyerLocation, sellerLocation]);

  const fetchSafeLocations = async () => {
    if (!buyerLocation || !sellerLocation) return;

    try {
      const response = await fetch(
        `/api/meetups/safe-locations?` +
          `buyerLat=${buyerLocation.lat}&buyerLng=${buyerLocation.lng}&` +
          `sellerLat=${sellerLocation.lat}&sellerLng=${sellerLocation.lng}`,
      );

      if (!response.ok) throw new Error("Failed to fetch safe locations");

      const data = await response.json();
      setSafeLocations(data.locations || []);
    } catch (error) {
      console.error("Error fetching safe locations:", error);
    }
  };

  const fetchSafetyTips = async () => {
    try {
      const response = await fetch("/api/meetups/safety-tips");
      if (!response.ok) throw new Error("Failed to fetch safety tips");

      const data = await response.json();
      setSafetyTips(data.tips || []);
    } catch (error) {
      console.error("Error fetching safety tips:", error);
    }
  };

  const handleScheduleMeetup = async () => {
    if (!selectedLocation || !scheduledTime || !safetyTipsAcknowledged) {
      alert("Please select a location, time, and acknowledge safety tips");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionId,
          buyer_id: buyerId,
          seller_id: sellerId,
          location_name: selectedLocation.name,
          location_address: selectedLocation.address,
          location_latitude: selectedLocation.latitude,
          location_longitude: selectedLocation.longitude,
          scheduled_time: new Date(scheduledTime).toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule meetup");

      const data = await response.json();
      onScheduled?.(data.meetup.id);
    } catch (error) {
      console.error("Error scheduling meetup:", error);
      alert("Failed to schedule meetup");
    } finally {
      setLoading(false);
    }
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case "police_station":
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "bank":
        return <MapPin className="h-5 w-5 text-green-500" />;
      case "shopping_mall":
        return <MapPin className="h-5 w-5 text-purple-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLocationTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Safety Tips Modal */}
      {showSafetyTips && (
        <Card className="p-6 border-2 border-yellow-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Safety Tips</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSafetyTips(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 mb-4">
            {safetyTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="acknowledge-tips"
              checked={safetyTipsAcknowledged}
              onChange={(e) => setSafetyTipsAcknowledged(e.target.checked)}
              className="rounded border-gray-300"
              aria-label="Acknowledge safety tips"
              title="Check to confirm you have read and understood the safety tips"
            />
            <Label
              htmlFor="acknowledge-tips"
              className="text-sm cursor-pointer"
            >
              I have read and understood these safety tips
            </Label>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Schedule Safe Meetup</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSafetyTips(true)}
        >
          <Shield className="h-4 w-4 mr-2" />
          Safety Tips
        </Button>
      </div>

      {/* Safe Locations */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Verified Safe Locations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeLocations.map((location) => (
            <Card
              key={location.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedLocation?.id === location.id
                  ? "border-2 border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedLocation(location)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getLocationTypeIcon(location.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold truncate">
                        {location.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {getLocationTypeLabel(location.type)}
                      </p>
                    </div>
                    {selectedLocation?.id === location.id && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {location.address}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {location.distance_from_buyer !== undefined && (
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span>
                          {location.distance_from_buyer.toFixed(1)}km from you
                        </span>
                      </div>
                    )}
                    {location.distance_from_seller !== undefined && (
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span>
                          {location.distance_from_seller.toFixed(1)}km from
                          seller
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {safeLocations.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                Enable location access to see safe meetup locations near you
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Schedule Time */}
      {selectedLocation && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduled-time">Meetup Time</Label>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="scheduled-time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="flex-1"
                />
              </div>
            </div>

            {scheduledTime && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Meetup Summary</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedLocation.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(scheduledTime), "PPpp")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleScheduleMeetup}
                disabled={loading || !scheduledTime || !safetyTipsAcknowledged}
                className="flex-1"
              >
                {loading ? "Scheduling..." : "Schedule Meetup"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLocation(null);
                  setScheduledTime("");
                }}
              >
                Cancel
              </Button>
            </div>

            {!safetyTipsAcknowledged && (
              <p className="text-sm text-yellow-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Please read and acknowledge the safety tips before scheduling
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
