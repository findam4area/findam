/**
 * Tracking Page
 * Displays shipment tracking information
 * Requirements: 8.3, 8.5, 8.6, 8.7, 8.8
 */

import { TrackingPage } from "@/components/logistics";
import { Metadata } from "next";

interface TrackingPageProps {
  params: Promise<{
    shipmentId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Track Your Delivery - FindAm",
  description:
    "Track your shipment in real-time with detailed delivery updates",
  robots: "noindex", // Don't index tracking pages
};

export default async function Tracking({ params }: TrackingPageProps) {
  const { shipmentId } = await params;
  return (
    <div className="min-h-screen bg-background">
      <TrackingPage shipmentId={shipmentId} />
    </div>
  );
}
