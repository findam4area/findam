/**
 * Example Usage: RejectListingModal Component
 * 
 * This file demonstrates how to integrate the RejectListingModal
 * into admin listing approval workflows.
 * 
 * Task: 8.4
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RejectListingModal } from './reject-listing-modal';
import { Button } from '@/components/ui/button';

interface Listing {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Example: Admin Listing Approval Card
 * 
 * Shows how to integrate the RejectListingModal into an admin
 * listing approval interface.
 */
export function ListingApprovalCardExample({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [showRejectModal, setShowRejectModal] = useState(false);

  /**
   * Handle successful rejection
   * Refresh the page to show updated listing status
   */
  const handleRejectSuccess = () => {
    router.refresh();
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-lg">{listing.title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{listing.description}</p>
      
      <div className="flex gap-2 mt-4">
        <Button variant="default">
          Approve Listing
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => setShowRejectModal(true)}
        >
          Reject Listing
        </Button>
      </div>

      {/* Reject Modal */}
      <RejectListingModal
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        listingId={listing.id}
        listingTitle={listing.title}
        onRejectSuccess={handleRejectSuccess}
      />
    </div>
  );
}

/**
 * Example: Admin Listing Queue Page
 * 
 * Shows how to use the modal in a full admin page context.
 */
export function AdminListingQueueExample() {
  const router = useRouter();
  const [rejectingListing, setRejectingListing] = useState<Listing | null>(null);

  const pendingListings: Listing[] = [
    { id: '1', title: 'Professional Cleaning Service', description: 'Top-notch cleaning...', status: 'pending' },
    { id: '2', title: 'Web Design Services', description: 'Custom websites...', status: 'pending' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Listings</h1>
      
      <div className="space-y-4">
        {pendingListings.map((listing) => (
          <div key={listing.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{listing.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{listing.description}</p>
            
            <div className="flex gap-2 mt-4">
              <Button variant="default">
                Approve
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => setRejectingListing(listing)}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal - Shared for all listings */}
      {rejectingListing && (
        <RejectListingModal
          open={!!rejectingListing}
          onOpenChange={(open) => !open && setRejectingListing(null)}
          listingId={rejectingListing.id}
          listingTitle={rejectingListing.title}
          onRejectSuccess={() => {
            setRejectingListing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/**
 * Example: Programmatic Modal Trigger
 * 
 * Shows how to trigger the modal from other actions.
 */
export function ProgrammaticRejectExample() {
  const router = useRouter();
  const [modalState, setModalState] = useState<{
    open: boolean;
    listingId: string;
    listingTitle: string;
  }>({
    open: false,
    listingId: '',
    listingTitle: '',
  });

  /**
   * Function that can be called from anywhere to reject a listing
   */
  const triggerReject = (listingId: string, listingTitle: string) => {
    setModalState({
      open: true,
      listingId,
      listingTitle,
    });
  };

  return (
    <div>
      {/* Your UI components */}
      <Button onClick={() => triggerReject('listing-123', 'Example Listing')}>
        Reject This Listing
      </Button>

      {/* Modal */}
      <RejectListingModal
        open={modalState.open}
        onOpenChange={(open) =>
          setModalState((prev) => ({ ...prev, open }))
        }
        listingId={modalState.listingId}
        listingTitle={modalState.listingTitle}
        onRejectSuccess={() => {
          setModalState({ open: false, listingId: '', listingTitle: '' });
          router.refresh();
        }}
      />
    </div>
  );
}
