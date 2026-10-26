"use client";

/**
 * DeliveryTimeline Component
 * Task 30.5: Visual delivery progress display
 * Requirements: 8.3
 */

import { Check, Circle, Package, Truck, Home, XCircle } from "lucide-react";
import type { TrackingEvent, ShipmentStatus } from "@/lib/types/logistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DeliveryTimelineProps {
  currentStatus: ShipmentStatus;
  history: TrackingEvent[];
  className?: string;
}

const timelineSteps: Array<{
  status: ShipmentStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { status: "pending", label: "Order Placed", icon: Package },
  { status: "picked_up", label: "Picked Up", icon: Package },
  { status: "in_transit", label: "In Transit", icon: Truck },
  { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Home },
];

const statusOrder: Record<ShipmentStatus, number> = {
  pending: 0,
  picked_up: 1,
  in_transit: 2,
  out_for_delivery: 3,
  delivered: 4,
  failed: -1,
};

export function DeliveryTimeline({
  currentStatus,
  history,
  className,
}: DeliveryTimelineProps) {
  const currentStepIndex = statusOrder[currentStatus];
  const isFailed = currentStatus === "failed";

  // Get the most recent event for each status
  const statusEvents = new Map<string, TrackingEvent>();
  history.forEach((event) => {
    const existingEvent = statusEvents.get(event.status);
    if (
      !existingEvent ||
      new Date(event.timestamp) > new Date(existingEvent.timestamp)
    ) {
      statusEvents.set(event.status, event);
    }
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Delivery Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Steps */}
          <div className="relative">
            {timelineSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;
              const event = statusEvents.get(step.status);

              const Icon = step.icon;

              return (
                <div key={step.status} className="relative">
                  {/* Connector Line */}
                  {index < timelineSteps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-4 top-8 h-12 w-0.5",
                        isCompleted ? "bg-primary" : "bg-gray-200",
                      )}
                      aria-hidden="true"
                    />
                  )}

                  {/* Step */}
                  <div className="flex items-start gap-4 pb-8">
                    {/* Icon Circle */}
                    <div
                      className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                        isCompleted &&
                          "border-primary bg-primary text-primary-foreground",
                        isCurrent &&
                          "border-primary bg-background text-primary animate-pulse",
                        isUpcoming &&
                          "border-gray-300 bg-background text-gray-400",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" aria-label="Completed" />
                      ) : isCurrent ? (
                        <Icon className="h-4 w-4" aria-label="Current step" />
                      ) : (
                        <Circle
                          className="h-3 w-3"
                          aria-label="Upcoming step"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          (isCompleted || isCurrent) && "text-foreground",
                          isUpcoming && "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </p>

                      {event && (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {event.description}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground">
                              📍 {event.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Failed Status */}
          {isFailed && (
            <div className="flex items-start gap-4 rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-destructive bg-background text-destructive">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  Delivery Failed
                </p>
                {history.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {history[history.length - 1].description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* All Events History */}
          {history.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                View Full History ({history.length} events)
              </summary>
              <div className="mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
                {[...history]
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime(),
                  )
                  .map((event, index) => (
                    <div key={event.id || index} className="space-y-1">
                      <p className="text-sm font-medium capitalize">
                        {event.status.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground">
                          📍 {event.location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
