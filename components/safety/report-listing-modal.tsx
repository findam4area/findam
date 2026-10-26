"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, X, CheckCircle } from "lucide-react";

interface ReportListingModalProps {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: "scam", label: "Suspected Scam" },
  { value: "fake", label: "Fake or Counterfeit Item" },
  { value: "misleading", label: "Misleading Information" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "duplicate", label: "Duplicate Listing" },
  { value: "stolen", label: "Stolen Item" },
  { value: "prohibited", label: "Prohibited Item" },
  { value: "other", label: "Other" },
];

export function ReportListingModal({
  listingId,
  listingTitle,
  onClose,
}: ReportListingModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedReason) {
      setError("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listings/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_id: listingId,
          reason: selectedReason,
          description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit report");
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting report:", err);
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-dark-card p-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="mb-2 text-lg font-semibold">Report Submitted</h3>
          <p className="text-sm text-muted-foreground">
            Thank you for helping keep FindAm safe. We&apos;ll review this listing
            shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-dark-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Report Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Reporting: <span className="font-medium">{listingTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Reason for reporting *</Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-dark-border p-3 hover:bg-white/5"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 accent-naija-green"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="mb-2 block">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional information that might help us review this listing..."
              rows={4}
              className="resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !selectedReason}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          False reports may result in account suspension. Please only report
          listings that violate our community guidelines.
        </p>
      </div>
    </div>
  );
}
