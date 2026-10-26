"use client";

/**
 * Meetup Check-In Component
 * Allows users to check in at meetup location
 * Requirements: 21.5, 21.10
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  CheckCircle,
  Clock,
  User,
  AlertCircle,
  Share2,
} from "lucide-react";
import { format } from "date-fns";

interface Meetup {
  id: string;
  location_name: string;
  location_address: string;
  scheduled_time: Date;
  buyer_checked_in: boolean;
  seller_checked_in: boolean;
  buyer_checked_in_at?: Date;
  seller_checked_in_at?: Date;
  status: string;
}

interface MeetupCheckInProps {
  meetup: Meetup;
  userType: "buyer" | "seller";
  onCheckIn?: () => void;
  onComplete?: () => void;
}

export function MeetupCheckIn({
  meetup,
  userType,
  onCheckIn,
  onComplete,
}: MeetupCheckInProps) {
  const [loading, setLoading] = useState(false);
  const [showLocationShare, setShowLocationShare] = useState(false);

  const isUserCheckedIn =
    userType === "buyer" ? meetup.buyer_checked_in : meetup.seller_checked_in;
  const isOtherCheckedIn =
    userType === "buyer" ? meetup.seller_checked_in : meetup.buyer_checked_in;
  const bothCheckedIn = meetup.buyer_checked_in && meetup.seller_checked_in;

  const handleCheckIn = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/meetups/${meetup.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType }),
      });

      if (!response.ok) throw new Error("Failed to check in");

      const data = await response.json();

      if (data.bothCheckedIn) {
        // Both parties checked in, show completion prompt
        onComplete?.();
      } else {
        onCheckIn?.();
      }
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  const handleShareLocation = () => {
    if (navigator.share && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

          navigator
            .share({
              title: "My Current Location",
              text: "I'm at the meetup location",
              url: locationUrl,
            })
            .catch((error) => console.error("Error sharing:", error));
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location");
        },
      );
    } else {
      alert("Location sharing is not supported on this device");
    }
  };

  return (
    <div className="space-y-4">
      {/* Meetup Details */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <MapPin className="h-6 w-6 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {meetup.location_name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {meetup.location_address}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(meetup.scheduled_time), "PPpp")}
            </div>
          </div>
        </div>

        {/* Check-in Status */}
        <div className="space-y-3 mb-4">
          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${
              isUserCheckedIn ? "bg-green-50" : "bg-muted/50"
            }`}
          >
            {isUserCheckedIn ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                You ({userType === "buyer" ? "Buyer" : "Seller"})
              </p>
              {isUserCheckedIn && meetup[`${userType}_checked_in_at`] && (
                <p className="text-xs text-muted-foreground">
                  Checked in at{" "}
                  {format(new Date(meetup[`${userType}_checked_in_at`]!), "p")}
                </p>
              )}
            </div>
            {isUserCheckedIn && (
              <span className="text-sm text-green-600 font-medium">
                Checked In
              </span>
            )}
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${
              isOtherCheckedIn ? "bg-green-50" : "bg-muted/50"
            }`}
          >
            {isOtherCheckedIn ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {userType === "buyer" ? "Seller" : "Buyer"}
              </p>
              {isOtherCheckedIn &&
                meetup[
                  `${userType === "buyer" ? "seller" : "buyer"}_checked_in_at`
                ] && (
                  <p className="text-xs text-muted-foreground">
                    Checked in at{" "}
                    {format(
                      new Date(
                        meetup[
                          `${userType === "buyer" ? "seller" : "buyer"}_checked_in_at`
                        ]!,
                      ),
                      "p",
                    )}
                  </p>
                )}
            </div>
            {isOtherCheckedIn && (
              <span className="text-sm text-green-600 font-medium">
                Checked In
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isUserCheckedIn && (
          <div className="space-y-3">
            <Button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? "Checking In..." : "Check In at Location"}
            </Button>

            <Button
              variant="outline"
              onClick={handleShareLocation}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Live Location
            </Button>
          </div>
        )}

        {/* Completion Prompt */}
        {bothCheckedIn && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 mb-1">
                  Both parties have checked in!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Please complete the transaction and confirm when done.
                </p>
                <Button size="sm" onClick={onComplete}>
                  Complete Transaction
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Waiting Message */}
        {isUserCheckedIn && !isOtherCheckedIn && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  Waiting for other party
                </p>
                <p className="text-sm text-blue-700">
                  The {userType === "buyer" ? "seller" : "buyer"} hasn't checked
                  in yet. You'll be notified when they arrive.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
