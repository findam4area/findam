"use client";

/**
 * Claim Business Button Component
 * Displays "Claim This Business" button on unclaimed business profiles
 * Requirements: 23.1
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClaimBusinessForm } from "./claim-business-form";

interface ClaimBusinessButtonProps {
  businessId: string;
  businessName: string;
  isClaimable: boolean;
  isClaimed: boolean;
  className?: string;
}

export function ClaimBusinessButton({
  businessId,
  businessName,
  isClaimable,
  isClaimed,
  className,
}: ClaimBusinessButtonProps) {
  const [open, setOpen] = useState(false);

  // Don't show button if business is not claimable or already claimed
  if (!isClaimable || isClaimed) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={className}
          aria-label={`Claim ${businessName}`}
        >
          <Shield className="mr-2 h-4 w-4" />
          Claim This Business
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim {businessName}</DialogTitle>
          <DialogDescription>
            Are you the owner of this business? Claim it to manage your profile, respond to reviews, and unlock premium features.
          </DialogDescription>
        </DialogHeader>
        <ClaimBusinessForm
          businessId={businessId}
          businessName={businessName}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
