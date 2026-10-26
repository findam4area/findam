/**
 * RejectVendorModal Component
 * 
 * Client Component for rejecting vendor applications with a reason.
 * Uses Radix Dialog for accessible modal functionality.
 * 
 * Requirements: 4.6
 */

'use client';

import { useState } from 'react';
import { rejectVendorAction } from '@/lib/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, X } from 'lucide-react';

interface RejectVendorModalProps {
  applicationId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RejectVendorModal({
  applicationId,
  businessName,
  open,
  onOpenChange,
  onSuccess,
}: RejectVendorModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Character count validation
  const charCount = reason.length;
  const minChars = 10;
  const maxChars = 500;
  const isValid = charCount >= minChars && charCount <= maxChars;
  const showMinWarning = charCount > 0 && charCount < minChars;
  const showMaxWarning = charCount > maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!isValid) {
      if (charCount < minChars) {
        setError(`Rejection reason must be at least ${minChars} characters`);
      } else if (charCount > maxChars) {
        setError(`Rejection reason must be at most ${maxChars} characters`);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Call Server Action
      const result = await rejectVendorAction(applicationId, reason);

      if (!result.success) {
        setError(result.error || 'Failed to reject vendor application');
        return;
      }

      // Success - close modal and notify parent
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Error rejecting vendor application:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Reject Vendor Application
          </DialogTitle>
          <DialogDescription>
            Rejecting: <span className="font-medium">{businessName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason" className="mb-2 block">
              Rejection Reason *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear reason for rejecting this vendor application. This will be sent to the applicant."
              rows={6}
              className="resize-none"
              disabled={isSubmitting}
            />
            
            {/* Character count */}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`${
                  showMinWarning
                    ? 'text-yellow-500'
                    : showMaxWarning
                    ? 'text-red-500'
                    : charCount >= minChars
                    ? 'text-green-500'
                    : 'text-muted-foreground'
                }`}
              >
                {charCount}/{maxChars} characters
              </span>
              {showMinWarning && (
                <span className="text-yellow-500">
                  Minimum {minChars} characters required
                </span>
              )}
              {showMaxWarning && (
                <span className="text-red-500">Maximum exceeded</span>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Warning message */}
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-500">
            <p className="font-medium">⚠️ Important:</p>
            <p className="mt-1">
              The applicant will receive this rejection reason via email.
              Please be clear, professional, and constructive.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
