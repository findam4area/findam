/**
 * ListingApprovalCard Client Component
 * 
 * This component displays a listing pending approval in the admin dashboard.
 * It shows the listing thumbnail (primary image), title, description preview,
 * user name, category, submitted date, and provides approve/reject actions.
 * 
 * Requirements: 3.3, 3.4
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { approveListingAction, rejectListingAction } from '@/lib/actions/admin-actions';
import { formatRelativeTime, truncateText } from '@/lib/utils';
import type { Listing } from '@/lib/types/core';
import { toastSuccess, toastError } from '@/lib/utils/toast';

interface ListingApprovalCardProps {
  listing: Listing & {
    user: {
      username?: string;
      full_name: string;
      email: string;
    };
    category: {
      name: string;
    };
  };
  onActionComplete?: () => void;
}

/**
 * ListingApprovalCard component for admin approval workflow
 * 
 * Displays listing information with approve/reject actions.
 * Handles loading states and error/success messages.
 * 
 * @param listing - The listing to display with user and category relations
 * @param onActionComplete - Optional callback when an action completes successfully
 */
export function ListingApprovalCard({
  listing,
  onActionComplete,
}: ListingApprovalCardProps) {
  // State management
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Get primary image URL (first image in the array)
  const primaryImageUrl = listing.images[listing.primary_image_index] || listing.images[0];

  /**
   * Handle approve button click
   * Calls approveListingAction and handles response
   */
  const handleApprove = async () => {
    setIsApproving(true);
    setMessage(null);

    try {
      const result = await approveListingAction(listing.id);

      if (result.success) {
        toastSuccess('Listing approved successfully', 'It is now publicly visible');
        setMessage({
          type: 'success',
          text: 'Listing approved successfully! It is now publicly visible.',
        });
        // Call the callback after a short delay to show success message
        setTimeout(() => {
          onActionComplete?.();
        }, 1500);
      } else {
        toastError('Failed to approve listing', result.error);
        setMessage({
          type: 'error',
          text: result.error || 'Failed to approve listing. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      toastError('Failed to approve listing', 'An unexpected error occurred');
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Handle reject button click
   * Opens the rejection reason modal
   */
  const handleRejectClick = () => {
    setShowRejectModal(true);
    setRejectionReason('');
    setMessage(null);
  };

  /**
   * Handle rejection confirmation with reason
   * Calls rejectListingAction with the provided reason
   */
  const handleRejectConfirm = async () => {
    if (rejectionReason.trim().length < 10) {
      setMessage({
        type: 'error',
        text: 'Rejection reason must be at least 10 characters.',
      });
      return;
    }

    setIsRejecting(true);
    setMessage(null);

    try {
      const result = await rejectListingAction(listing.id, rejectionReason);

      if (result.success) {
        toastSuccess('Listing rejected', 'The user has been notified');
        setMessage({
          type: 'success',
          text: 'Listing rejected. The user has been notified.',
        });
        setShowRejectModal(false);
        // Call the callback after a short delay to show success message
        setTimeout(() => {
          onActionComplete?.();
        }, 1500);
      } else {
        toastError('Failed to reject listing', result.error);
        setMessage({
          type: 'error',
          text: result.error || 'Failed to reject listing. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toastError('Failed to reject listing', 'An unexpected error occurred');
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  /**
   * Handle modal cancel
   * Closes the rejection modal and clears the reason
   */
  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setMessage(null);
  };

  return (
    <>
      <Card className="glass-card border-dark-border bg-dark-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-white truncate">
                {listing.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-naija-green">
                    {listing.user.username || listing.user.full_name}
                  </span>
                </span>
                <span>•</span>
                <span>{listing.category.name}</span>
                <span>•</span>
                <span>{formatRelativeTime(listing.created_at)}</span>
              </div>
            </div>

            {/* View listing button */}
            <Link
              href={`/listing/${listing.id}`}
              target="_blank"
              className="flex-shrink-0"
            >
              <Button
                size="sm"
                variant="ghost"
                title="View listing in new tab"
                className="min-h-[36px]"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View listing</span>
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="flex gap-4">
            {/* Listing thumbnail */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
              {primaryImageUrl ? (
                <Image
                  src={primaryImageUrl}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 96px, 128px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>

            {/* Listing details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-sm text-gray-300 line-clamp-3">
                  {truncateText(listing.description, 150)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {listing.price !== null && (
                  <span className="font-semibold text-naija-green">
                    ₦{listing.price.toLocaleString()}
                  </span>
                )}
                <span className="text-gray-400">
                  {listing.location_city}, {listing.location_state}
                </span>
              </div>

              <div className="text-xs text-gray-500">
                Contact: {listing.user.email}
              </div>
            </div>
          </div>

          {/* Success/Error message */}
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {/* Approve button */}
            <Button
              onClick={handleApprove}
              disabled={isApproving || isRejecting || message?.type === 'success'}
              variant="outline"
              className="flex-1 min-h-[44px] border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>

            {/* Reject button */}
            <Button
              onClick={handleRejectClick}
              disabled={isApproving || isRejecting || message?.type === 'success'}
              variant="destructive"
              className="flex-1 min-h-[44px]"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Rejection reason modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-dark-card border-dark-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Reject Listing
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting &quot;{truncateText(listing.title, 50)}&quot;.
              The user will receive this feedback via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label
                htmlFor="rejection-reason"
                className="text-sm font-medium text-gray-300 block mb-2"
              >
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejection-reason"
                className="w-full min-h-[120px] bg-dark-bg border border-dark-border rounded-md p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-naija-green focus:border-transparent resize-none"
                placeholder="Please be specific about why this listing cannot be approved (minimum 10 characters)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isRejecting}
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length} / 10 minimum characters
              </p>
            </div>

            {message && message.type === 'error' && (
              <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                {message.text}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleRejectCancel}
              disabled={isRejecting}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isRejecting || rejectionReason.trim().length < 10}
              className="min-h-[44px]"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
