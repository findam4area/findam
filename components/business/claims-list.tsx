"use client";

/**
 * Claims List Component
 * Displays list of user's business claim requests
 * Requirements: 23.2
 */

import { useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import { BusinessClaimRequest } from "@/lib/services/business-claim";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClaimsListProps {
  claims: Array<BusinessClaimRequest & { business_name?: string }>;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeVariant: "secondary" as const,
  },
  under_review: {
    icon: Eye,
    label: "Under Review",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    badgeVariant: "default" as const,
  },
  approved: {
    icon: CheckCircle,
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    badgeVariant: "default" as const,
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    badgeVariant: "destructive" as const,
  },
  expired: {
    icon: AlertCircle,
    label: "Expired",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    badgeVariant: "outline" as const,
  },
};

export function ClaimsList({ claims }: ClaimsListProps) {
  const [selectedClaim, setSelectedClaim] = useState<(BusinessClaimRequest & { business_name?: string }) | null>(null);

  return (
    <>
      <div className="space-y-4">
        {claims.map((claim) => {
          const config = statusConfig[claim.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={claim.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {(claim as any).business_profiles?.business_name || "Business"}
                    </h3>
                    <Badge variant={config.badgeVariant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    {(claim as any).business_profiles?.city && (
                      <span>
                        {(claim as any).business_profiles.city},{" "}
                        {(claim as any).business_profiles.state}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Submitted:</span>{" "}
                      {new Date(claim.created_at).toLocaleDateString()}
                    </div>
                    
                    {claim.email_verified && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Email Verified</span>
                      </div>
                    )}

                    {claim.domain_verified && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Domain Verified</span>
                      </div>
                    )}
                  </div>

                  {claim.status === "rejected" && claim.rejection_reason && (
                    <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {claim.rejection_reason}
                    </div>
                  )}

                  {claim.status === "approved" && (
                    <div className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800">
                      <strong>Congratulations!</strong> Your claim has been approved. You now have full control of this business profile.
                      {(claim as any).business_profiles && (
                        <Link
                          href={`/business-profiles/${claim.business_profile_id}`}
                          className="ml-2 font-semibold underline"
                        >
                          View Profile
                        </Link>
                      )}
                    </div>
                  )}

                  {claim.status === "pending" && !claim.email_verified && (
                    <div className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                      <strong>Action Required:</strong> Check your email ({claim.business_email}) to verify ownership.
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClaim(claim)}
                  className="ml-4"
                >
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Claim Details Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              Full information about your business claim request
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900">Business Information</h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {(selectedClaim as any).business_profiles?.business_name || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>{" "}
                    {(selectedClaim as any).business_profiles?.city},{" "}
                    {(selectedClaim as any).business_profiles?.state}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Claim Justification</h4>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedClaim.claim_justification}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Verification Status</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedClaim.email_verified ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">
                      Email ({selectedClaim.business_email})
                    </span>
                  </div>

                  {selectedClaim.domain_to_verify && (
                    <div className="flex items-center gap-2">
                      {selectedClaim.domain_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        Domain ({selectedClaim.domain_to_verify})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Documents Submitted</h4>
                <div className="mt-2 space-y-2">
                  {selectedClaim.business_registration_doc && (
                    <div className="text-sm">
                      <span className="font-medium">Business Registration:</span>{" "}
                      <a
                        href={selectedClaim.business_registration_doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {selectedClaim.tax_id_doc && (
                    <div className="text-sm">
                      <span className="font-medium">Tax ID:</span>{" "}
                      <a
                        href={selectedClaim.tax_id_doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {selectedClaim.additional_docs && selectedClaim.additional_docs.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Additional Documents:</span>
                      <ul className="ml-4 mt-1 list-disc">
                        {selectedClaim.additional_docs.map((doc, index) => (
                          <li key={index}>
                            <a
                              href={doc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              Document {index + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!selectedClaim.business_registration_doc &&
                    !selectedClaim.tax_id_doc &&
                    (!selectedClaim.additional_docs || selectedClaim.additional_docs.length === 0) && (
                      <p className="text-sm text-gray-500">No documents submitted</p>
                    )}
                </div>
              </div>

              {selectedClaim.reviewed_at && (
                <div>
                  <h4 className="font-semibold text-gray-900">Review Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Reviewed at:</span>{" "}
                      {new Date(selectedClaim.reviewed_at).toLocaleString()}
                    </div>
                    {selectedClaim.review_notes && (
                      <div>
                        <span className="font-medium">Notes:</span>{" "}
                        {selectedClaim.review_notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <div>Claim ID: {selectedClaim.id}</div>
                <div>
                  Expires: {new Date(selectedClaim.expires_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
