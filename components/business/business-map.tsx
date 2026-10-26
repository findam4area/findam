"use client";

// Business Map Component - Wrapper for react-map-gl
// Requirements: 21.3 - Display business locations with Mapbox
// NOTE: Temporarily disabled due to Turbopack build issues with react-map-gl
// Will re-enable once Turbopack properly supports the module

import { Building2 } from "lucide-react";

interface BusinessMapProps {
  coordinates: [number, number];
  businessName: string;
}

// Fallback component - maps temporarily unavailable in production build
export function BusinessMap({ coordinates, businessName }: BusinessMapProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-dark-bg/50 border border-dark-border rounded-lg">
      <div className="text-center px-4">
        <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          Map unavailable - Location: {businessName}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Coordinates: {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
        </p>
      </div>
    </div>
  );
}
