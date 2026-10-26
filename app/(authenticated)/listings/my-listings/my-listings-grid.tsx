"use client";

/**
 * MyListingsGrid Client Component
 * 
 * Displays user's listings in a responsive grid/table with:
 * - Status indicators with color coding
 * - Rejection reasons (expandable)
 * - Edit and Delete action buttons
 * - Mobile-first responsive layout (cards on mobile, table on desktop)
 * 
 * Requirements: 3.2
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { ListingWithRelations } from "@/lib/types/core";
import { Button } from "@/components/ui/button";
import { deleteListingAction } from "@/app/actions/listings";
import { cn } from "@/lib/utils";

interface MyListingsGridProps {
  listings: ListingWithRelations[];
}

export function MyListingsGrid({ listings }: MyListingsGridProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRejectionId, setExpandedRejectionId] = useState<string | null>(null);

  const handleDelete = async (listingId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(listingId);
    try {
      const result = await deleteListingAction(listingId);
      
      if (result.error) {
        alert(`Failed to delete listing: ${result.error}`);
      } else {
        // Refresh the page to show updated listings
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRejectionReason = (listingId: string) => {
    setExpandedRejectionId(prev => prev === listingId ? null : listingId);
  };

  // Status badge configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          className: 'bg-green-500/10 text-green-500 border-green-500/30'
        };
      case 'pending':
        return {
          label: 'Pending Review',
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          className: 'bg-red-500/10 text-red-500 border-red-500/30'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/30'
        };
    }
  };

  // Format price
  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact for price';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {/* Mobile: Card Layout */}
      <div className="lg:hidden space-y-4">
        {listings.map((listing) => {
          const statusConfig = getStatusConfig(listing.status);
          const primaryImageUrl = listing.images?.[listing.primary_image_index] || listing.images?.[0];
          const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.title)}&size=200&background=random&color=fff`;
          const imageUrl = primaryImageUrl || placeholderImage;
          const hasRejectionReason = listing.status === 'rejected' && listing.rejection_reason;
          const isExpanded = expandedRejectionId === listing.id;

          return (
            <div
              key={listing.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="flex gap-4 p-4">
                {/* Image */}
                <Link
                  href={`/listing/${listing.id}`}
                  className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-800"
                >
                  <Image
                    src={imageUrl}
                    alt={listing.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="block group"
                  >
                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
                      {listing.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{listing.location_city}</span>
                  </div>

                  <div className="text-sm font-semibold text-primary-400 mb-2">
                    {formatPrice(listing.price)}
                  </div>

                  {/* Status Badge */}
                  <div className={cn(
                    "inline-flex px-2 py-1 rounded-full border text-xs font-medium",
                    statusConfig.className
                  )}>
                    {statusConfig.label}
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {hasRejectionReason && (
                <div className="border-t border-gray-800">
                  <button
                    onClick={() => toggleRejectionReason(listing.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Rejection Reason</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 text-sm text-gray-300 bg-red-500/5">
                      {listing.rejection_reason}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-800 p-4 flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Link href={`/listings/edit/${listing.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(listing.id, listing.title)}
                  disabled={deletingId === listing.id}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deletingId === listing.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>

              {/* Timestamp */}
              <div className="px-4 pb-3 flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>
                  Created {new Date(listing.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/80 border-b border-gray-800">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Listing
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Location
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Price
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Created
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {listings.map((listing) => {
                const statusConfig = getStatusConfig(listing.status);
                const primaryImageUrl = listing.images?.[listing.primary_image_index] || listing.images?.[0];
                const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.title)}&size=200&background=random&color=fff`;
                const imageUrl = primaryImageUrl || placeholderImage;
                const hasRejectionReason = listing.status === 'rejected' && listing.rejection_reason;
                const isExpanded = expandedRejectionId === listing.id;

                return (
                  <>
                    <tr key={listing.id} className="hover:bg-gray-800/50 transition-colors">
                      {/* Listing (with image and title) */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/listing/${listing.id}`}
                          className="flex items-center gap-4 group"
                        >
                          <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                            <Image
                              src={imageUrl}
                              alt={listing.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                              {listing.title}
                            </h3>
                            {listing.category && (
                              <p className="text-sm text-gray-400 mt-1">
                                {listing.category.name}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-300">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span>{listing.location_city}, {listing.location_state}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-primary-400">
                          {formatPrice(listing.price)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className={cn(
                            "inline-flex px-3 py-1 rounded-full border text-xs font-medium w-fit",
                            statusConfig.className
                          )}>
                            {statusConfig.label}
                          </div>
                          {hasRejectionReason && (
                            <button
                              onClick={() => toggleRejectionReason(listing.id)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors w-fit"
                            >
                              <AlertCircle className="h-3 w-3" />
                              <span>View reason</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {new Date(listing.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <Link href={`/listings/edit/${listing.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(listing.id, listing.title)}
                            disabled={deletingId === listing.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {/* Rejection Reason Row (expanded) */}
                    {hasRejectionReason && isExpanded && (
                      <tr key={`${listing.id}-rejection`}>
                        <td colSpan={6} className="px-6 py-4 bg-red-500/5">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-red-400 mb-1">
                                Rejection Reason:
                              </div>
                              <div className="text-sm text-gray-300">
                                {listing.rejection_reason}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
