"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
  centerContent?: boolean;
}

/**
 * Responsive container component that adapts to different screen sizes
 * Ensures proper spacing and layout on mobile, tablet, and desktop
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = "2xl",
  padding = true,
  centerContent = false,
}) => {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto",
        maxWidthClasses[maxWidth],
        padding && "px-4 sm:px-6 lg:px-8",
        centerContent && "flex items-center justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
};

export interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

/**
 * Responsive grid component with configurable columns for different breakpoints
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
}) => {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={cn(gridClasses, className)}>{children}</div>;
};

export interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: "vertical" | "horizontal" | "responsive";
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
}

/**
 * Responsive stack component for flexible layouts
 */
export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className,
  direction = "vertical",
  gap = 4,
  align = "stretch",
}) => {
  const directionClasses = {
    vertical: "flex flex-col",
    horizontal: "flex flex-row",
    responsive: "flex flex-col md:flex-row",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  return (
    <div
      className={cn(
        directionClasses[direction],
        alignClasses[align],
        `gap-${gap}`,
        className,
      )}
    >
      {children}
    </div>
  );
};
