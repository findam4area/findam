/**
 * VendorApprovalCard Client Component
 * 
 * Displays vendor application details in a card format with approve/reject actions.
 * This component is used in the admin dashboard to review and approve/reject vendor applications.
 * 
 * Features:
 * - Display business name, description, contact details
 * - Display user information and submission date
 * - Approve button with loading state
 * - Reject button that opens a modal for rejection reason
 * - Success/error toast notifications
 * - Mobile-responsive card layout
 * 
 * Requirements: 4.3, 4.4, 4.6
 */

'use client';

import { useState } from 'react';
import { Loader2, Check, X, Mail, Phone, User, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { approveVendorAction, rejectVendorAction } from '@/lib/actions/admin-actions';
import type { VendorApplicationWithUser } from '@/lib/types/core';
import { toastSuccess, toastError } from '@/lib/utils/toast';

// ============================================================================
// Props Interface
// ============================================================================

export interface VendorApprovalCardProps {
  application: VendorApplicationWithUser;
  onApproved?: () => void;
  onRejected?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function VendorApprovalCard({
  application,
  onApproved,
  onRejected,
}: VendorApprovalCardProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [isApproving, setIsApproving] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle approval action
   * Requirements: 4.4
   */
  const handleApprove = async () => {
    setIsApproving(true);

    try {
      const result = await approveVendorAction(application.id);

      if (result.success) {
        toastSuccess('Vendor application approved successfully! 🎉', `${application.business_name} is now a verified vendor.`);
        onApproved?.();
      } else {
        toastError('Failed to approve vendor application', result.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      console.error('Error approving vendor:', error);
      toastError('Failed to approve vendor application', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Handle opening reject dialog
   */
  const handleOpenRejectDialog = () => {
    setRejectionReason('');
    setReasonError(null);
    setIsRejectDialogOpen(true);
  };

  /**
   * Handle rejection action
   * Requirements: 4.6
   */
  const handleReject = async () => {
    // Validate rejection reason (minimum 10 characters)
    if (rejectionReason.trim().length < 10) {
      setReasonError('Rejection reason must be at least 10 characters');
      return;
    }

    if (rejectionReason.trim().length > 500) {
      setReasonError('Rejection reason must be at most 500 characters');
      return;
    }

    setReasonError(null);
    setIsRejecting(true);

    try {
      const result = await rejectVendorAction(application.id, rejectionReason.trim());

      if (result.success) {
        toastSuccess('Vendor application rejected', 'The applicant has been notified.');
        setIsRejectDialogOpen(false);
        onRejected?.();
      } else {
        toastError('Failed to reject vendor application', result.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      toastError('Failed to reject vendor application', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  /**
   * Handle rejection reason input change
   */
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRejectionReason(e.target.value);
    if (reasonError) {
      setReasonError(null);
    }
  };

  // ============================================================================
  // Format Date
  // ============================================================================

  const formattedDate = format(new Date(application.created_at), 'MMM d, yyyy');

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                {application.business_name}
              </CardTitle>
              <CardDescription className="mt-1">
                Vendor Application
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              {application.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Business Description */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Business Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {application.business_description}
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Contact Email</p>
                <p className="text-sm font-medium truncate">{application.contact_email}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Contact Phone</p>
                <p className="text-sm font-medium">{application.contact_phone}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Applicant</p>
                <p className="text-sm font-medium truncate">
                  {application.user?.full_name || 'Unknown User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {application.user?.email || ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-medium">{formattedDate}</p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleOpenRejectDialog}
            disabled={isApproving || isRejecting}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          
          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="w-full sm:w-auto"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {application.business_name}'s vendor application.
              The applicant will receive this feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this vendor application cannot be approved at this time..."
                value={rejectionReason}
                onChange={handleReasonChange}
                rows={4}
                className={reasonError ? 'border-destructive' : ''}
                disabled={isRejecting}
              />
              {reasonError && (
                <p className="text-sm text-destructive">{reasonError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters, maximum 500 characters ({rejectionReason.length}/500)
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isRejecting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || rejectionReason.trim().length < 10}
              className="w-full sm:w-auto"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
