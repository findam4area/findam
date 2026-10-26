"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface LogoProps {
  variant?: "default" | "compact" | "icon-only";
  className?: string;
  linkTo?: string;
  priority?: boolean;
}

/**
 * FindAm Logo Component
 * 
 * Displays the FindAm logo with different size variants.
 * Features the vibrant gradient pin icon with "findam" text.
 * Falls back to text logo if image is not available.
 * 
 * @param variant - "default" (full size), "compact" (smaller), "icon-only" (just the icon)
 * @param className - Additional CSS classes
 * @param linkTo - Optional link destination (defaults to "/")
 * @param priority - Whether to prioritize image loading
 */
export function Logo({ 
  variant = "default", 
  className = "",
  linkTo = "/",
  priority = false 
}: LogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    default: {
      width: 200,
      height: 56,
      containerClass: "h-14 w-auto",
      textClass: "text-2xl",
    },
    compact: {
      width: 140,
      height: 40,
      containerClass: "h-10 w-auto",
      textClass: "text-xl",
    },
    "icon-only": {
      width: 48,
      height: 48,
      containerClass: "h-12 w-12",
      textClass: "text-lg",
    },
  };

  const { width, height, containerClass, textClass } = sizes[variant];

  // Text fallback logo - matches the logo color scheme
  const textLogo = (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-orange-500 to-blue-600 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
      </div>
      <span className={`${textClass} font-bold`}>
        <span className="text-pink-500">find</span>
        <span className="text-blue-500">am</span>
      </span>
    </div>
  );

  // Image logo with fallback
  const logoElement = imageError ? textLogo : (
    <div className={`relative ${containerClass} ${className}`}>
      <Image
        src="/images/findam-logo.png"
        alt="FindAm - Nigeria's Business Directory Marketplace"
        width={width}
        height={height}
        priority={priority}
        sizes="(max-width: 768px) 140px, 200px"
        className="object-contain"
        onError={() => {
          console.warn("Logo image not found, using text fallback");
          setImageError(true);
        }}
      />
    </div>
  );

  if (linkTo) {
    return (
      <Link 
        href={linkTo}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-lg inline-block"
        aria-label="Go to FindAm homepage"
      >
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
