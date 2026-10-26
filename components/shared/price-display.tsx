"use client";

import numeral from "numeral";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showCurrency?: boolean;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export function PriceDisplay({
  amount,
  size = "md",
  className = "",
  showCurrency = true,
}: PriceDisplayProps) {
  const formattedAmount = numeral(amount).format("0,0");

  return (
    <span
      className={cn(
        "font-mono font-bold text-naija-green",
        sizeClasses[size],
        className,
      )}
    >
      {showCurrency && "₦"}
      {formattedAmount}
    </span>
  );
}
