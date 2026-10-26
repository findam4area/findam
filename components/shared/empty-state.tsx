/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states with customizable content.
 * Used when no data is available (e.g., no search results, empty categories).
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * 
 * Features:
 * - Customizable title, message, icon, and action button
 * - Centered layout with accessible contrast
 * - Responsive design for mobile and desktop
 * - Optional action button for user guidance
 * 
 * Usage:
 * ```tsx
 * <EmptyState
 *   title="No Results Found"
 *   message="Try adjusting your search or filters"
 *   icon={<Search className="w-12 h-12" />}
 *   action={{
 *     label: "Clear Filters",
 *     onClick: handleClearFilters
 *   }}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, Package } from "lucide-react";

export interface EmptyStateProps {
  /**
   * The main heading displayed to the user
   */
  title: string;
  
  /**
   * Descriptive message providing context or guidance
   */
  message: string;
  
  /**
   * Optional custom icon to display above the title
   * If not provided, a default icon will be used based on context
   */
  icon?: React.ReactNode;
  
  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  
  /**
   * Optional CSS classes for custom styling
   */
  className?: string;
}

/**
 * Default icons for common empty state scenarios
 */
const defaultIcons = {
  search: <Search className="w-12 h-12 text-gray-400" aria-hidden="true" />,
  error: <AlertCircle className="w-12 h-12 text-gray-400" aria-hidden="true" />,
  empty: <Package className="w-12 h-12 text-gray-400" aria-hidden="true" />,
};

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: EmptyStateProps) {
  // Use provided icon or fall back to default empty icon
  const displayIcon = icon || defaultIcons.empty;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] px-4 py-12 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="mb-6 flex items-center justify-center">
        {displayIcon}
      </div>

      {/* Title */}
      <h2 
        className={cn(
          "text-2xl font-bold text-white mb-3",
          "md:text-3xl"
        )}
      >
        {title}
      </h2>

      {/* Message */}
      <p 
        className={cn(
          "text-gray-400 max-w-md mb-8 text-base",
          "md:text-lg"
        )}
      >
        {message}
      </p>

      {/* Optional Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant="default"
          size="lg"
          className="min-w-[160px]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Pre-configured empty state variants for common scenarios
 */
export const EmptyStateVariants = {
  /**
   * For search results with no matches
   */
  NoSearchResults: ({
    searchTerm,
    onClear,
  }: {
    searchTerm?: string;
    onClear: () => void;
  }) => (
    <EmptyState
      title="No Results Found"
      message={
        searchTerm
          ? `No categories match "${searchTerm}". Try a different search term.`
          : "No categories match your search criteria."
      }
      icon={<Search className="w-12 h-12 text-gray-400" aria-hidden="true" />}
      action={{
        label: "Clear Search",
        onClick: onClear,
      }}
    />
  ),

  /**
   * For filtered results with no matches
   */
  NoFilterResults: ({ onClear }: { onClear: () => void }) => (
    <EmptyState
      title="No Categories Match Your Filters"
      message="Try adjusting your filters to see more results."
      icon={<Package className="w-12 h-12 text-gray-400" aria-hidden="true" />}
      action={{
        label: "Clear Filters",
        onClick: onClear,
      }}
    />
  ),

  /**
   * For general empty data scenarios
   */
  NoData: ({ entityName = "items" }: { entityName?: string } = {}) => (
    <EmptyState
      title={`No ${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Available`}
      message={`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} will appear here once they're added.`}
      icon={<Package className="w-12 h-12 text-gray-400" aria-hidden="true" />}
    />
  ),

  /**
   * For error states
   */
  Error: ({ onRetry }: { onRetry?: () => void } = {}) => (
    <EmptyState
      title="Something Went Wrong"
      message="We couldn't load the data. Please try again."
      icon={<AlertCircle className="w-12 h-12 text-red-400" aria-hidden="true" />}
      action={
        onRetry
          ? {
              label: "Retry",
              onClick: onRetry,
            }
          : undefined
      }
    />
  ),
};
