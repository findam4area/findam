"use client";

import { MapPin } from "lucide-react";
import { formatLocation } from "@/lib/utils/location-helpers";

interface LocationDisplayProps {
  state: string;
  area?: string;
  className?: string;
  showIcon?: boolean;
  iconClassName?: string;
  textClassName?: string;
}

export function LocationDisplay({
  state,
  area,
  className = "",
  showIcon = true,
  iconClassName = "h-4 w-4",
  textClassName = "text-sm text-gray-400",
}: LocationDisplayProps) {
  const locationText = formatLocation(state, area);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showIcon && <MapPin className={iconClassName} />}
      <span className={textClassName}>{locationText}</span>
    </div>
  );
}
