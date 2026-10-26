/**
 * Vendor Application Status Component
 * 
 * This component displays the vendor application status on user profile:
 * - Pending status with waiting message
 * - Approved status (shown via vendor badge in ProfileHeader)
 * - Rejected status with reason
 * - Apply as vendor CTA if no application exists
 * 
 * Requirements: 2.7, 13.13
 * Task: 10.5 Create user profile page - vendor application status display
 */

'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface VendorApplicationStatusProps {
  vendorStatus: any | null;
  vendorApplication: any | null;
}

export function VendorApplicationStatus({
  vendorStatus,
  vendorApplication,
}: VendorApplicationStatusProps) {
  // If user is already an approved vendor, don&apos;t show anything
  // (the badge is shown in ProfileHeader)
  if (vendorStatus) {
    return null;
  }

  // If there's a pending or rejected application, show status
  if (vendorApplication) {
    return (
      <motion.div
        className="glass-card rounded-2xl border border-dark-border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">
          Vendor Application Status
        </h2>

        {vendorApplication.status === 'pending' && (
          <div className="flex items-start gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-300 mb-1">
                Application Pending
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                Your vendor application is currently under review. We&apos;ll notify you via email once It&apos;s been reviewed.
              </p>
              <p className="text-xs text-gray-400">
                Submitted: {new Date(vendorApplication.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {vendorApplication.status === 'rejected' && (
          <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 mb-1">
                Application Rejected
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Unfortunately, your vendor application was not approved.
              </p>
              {vendorApplication.rejection_reason && (
                <div className="p-3 bg-dark-bg rounded border border-red-500/20 mb-3">
                  <p className="text-sm font-medium text-red-300 mb-1">Reason:</p>
                  <p className="text-sm text-gray-300">
                    {vendorApplication.rejection_reason}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400">
                You can submit a new application by addressing the issues mentioned above.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // If no application exists, show CTA to apply
  return (
    <motion.div
      className="glass-card rounded-2xl border border-dark-border p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1">
            Become a Vendor
          </h2>
          <p className="text-gray-300 text-sm">
            Apply to become an approved vendor and get a verified badge on your listings.
          </p>
        </div>
        <Link href="/vendors/apply">
          <Button className="whitespace-nowrap">
            Apply Now
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
