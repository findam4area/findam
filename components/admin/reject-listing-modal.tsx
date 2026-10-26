/**
 * RejectListingModal Component
 * 
 * Client Component for admin listing rejection with reason input.
 * 
 * Features:
 * - Radix Dialog modal for rejection workflow
 * - Textarea for rejection reason (min 10 chars, max 500 chars)
 * - Character count display
 * - Client-side validation for reason length
 * - Submit via rejectListingAction Server Action
 * - Loading state during submission
 * - Close modal and show success message on completion
 * - Mobile-optimized touch-friendly design
 * 
 * Requirements: 3.6
 * Task: 8.4
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { rejectListingAction } from '@/lib/actions/admin-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectListingModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
  /** Listing ID to reject */
  listingId: string;
  /** Listing title for display */
  listingTitle: string;
  /** Callback fired after successful rejection */
  onRejectSuccess?: () => void;
}

/**
 * Modal for rejecting a listing with a reason
 * 
 * Validates reason length client-side (10-500 characters) and shows
 * real-time character count. Submits rejection via Server Action and
 * displays success/error messages.
 * 
 * @example
 * ```tsx
 * <RejectListingModal
 *   open={showRejectModal}
 *   onOpenChange={setShowRejectModal}
 *   listingId={listing.id}
 *   listingTitle={listing.title}
 *   onRejectSuccess={() => router.refresh()}
 * />
 * ```
 */
export function RejectListingModal({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  onRejectSuccess,
}: RejectListingModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Character count
  const charCount = reason.length;
  const minChars = 10;
  const maxChars = 500;
  const isValid = charCount >= minChars && charCount <= maxChars;

  /**
   * Handle reason text change with validation
   */
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReason(value);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }

    // Validate length in real-time
    if (value.length > maxChars) {
      setValidationError(`Rejection reason must be at most ${maxChars} characters`);
    } else if (value.length > 0 && value.length < minChars) {
      setValidationError(`Rejection reason must be at least ${minChars} characters`);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!reason.trim()) {
      setValidationError('Please provide a rejection reason');
      return;
    }

    if (!isValid) {
      setValidationError(
        charCount < minChars
          ? `Rejection reason must be at least ${minChars} characters`
          : `Rejection reason must be at most ${maxChars} characters`
      );
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // Submit via Server Action
      const result = await rejectListingAction(listingId, reason.trim());

      if (result.success) {
        // Success - close modal and show success message
        toast.success('Listing rejected successfully');
        handleClose();
        
        // Notify parent component
        onRejectSuccess?.();
      } else {
        // Show error from Server Action
        setValidationError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Unexpected error during listing rejection:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setValidationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close - reset state
   */
  const handleClose = () => {
    setReason('');
    setValidationError(null);
    onOpenChange(false);
  };

  /**
   * Get character count color based on validity
   */
  const getCharCountColor = () => {
    if (charCount === 0) return 'text-muted-foreground';
    if (charCount < minChars) return 'text-orange-500';
    if (charCount > maxChars) return 'text-destructive';
    return 'text-green-600';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejecting "{listingTitle}". The listing
              creator will receive this feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">
                Rejection Reason
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why this listing cannot be approved (e.g., inappropriate content, missing information, violates guidelines)..."
                value={reason}
                onChange={handleReasonChange}
                rows={5}
                className={`resize-none ${
                  validationError ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
                disabled={isSubmitting}
                aria-invalid={!!validationError}
                aria-describedby={validationError ? 'reason-error' : 'reason-hint'}
              />
              
              {/* Character count */}
              <div className="flex justify-between items-center text-sm">
                <span id="reason-hint" className="text-muted-foreground">
                  Minimum {minChars} characters required
                </span>
                <span className={getCharCountColor()}>
                  {charCount} / {maxChars}
                </span>
              </div>

              {/* Validation error */}
              {validationError && (
                <p
                  id="reason-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {validationError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Listing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
