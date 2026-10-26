"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import type { Report, PaginatedResponse } from "@/lib/types";
import type { FlaggedListing } from "@/types/moderation";
import { formatRelativeTime } from "@/lib/utils";

interface ModerationQueueProps {
  mode?: "reports" | "ai-moderation";
}

export function ModerationQueue({ mode = "reports" }: ModerationQueueProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<FlaggedListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "reviewed" | "all">(
    "pending",
  );
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === "ai-moderation") {
      fetchFlaggedListings();
    } else {
      fetchReports();
    }
  }, [filter, page, mode]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/reports?status=${filter}&page=${page}&limit=20`,
      );
      if (response.ok) {
        const data: PaginatedResponse<Report> = await response.json();
        setReports(data.data);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlaggedListings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/moderation/queue?status=${filter}&page=${page}&limit=20`,
      );
      if (response.ok) {
        const data = await response.json();
        setFlaggedListings(data.data);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Error fetching flagged listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (
    reportId: string,
    action: "approve" | "remove",
    status: "reviewed" | "resolved",
  ) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, status }),
      });

      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error("Error updating report:", error);
    }
  };

  const handleModerationReview = async (
    moderationId: string,
    decision: "approve" | "reject",
  ) => {
    try {
      setReviewingId(moderationId);
      const response = await fetch(`/api/moderation/${moderationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: adminNotes[moderationId] || undefined,
        }),
      });

      if (response.ok) {
        // Clear notes for this item
        setAdminNotes((prev) => {
          const updated = { ...prev };
          delete updated[moderationId];
          return updated;
        });
        // Refresh the list
        fetchFlaggedListings();
      } else {
        const error = await response.json();
        console.error("Error reviewing moderation:", error);
        alert(`Failed to ${decision} listing: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reviewing moderation:", error);
      alert(`Failed to ${decision} listing`);
    } finally {
      setReviewingId(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/20 text-red-500";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500";
      case "low":
        return "bg-blue-500/20 text-blue-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => {
            setFilter("pending");
            setPage(0);
          }}
        >
          Pending
        </Button>
        <Button
          variant={filter === "reviewed" ? "default" : "outline"}
          onClick={() => {
            setFilter("reviewed");
            setPage(0);
          }}
        >
          Reviewed
        </Button>
        {mode === "reports" && (
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => {
              setFilter("all");
              setPage(0);
            }}
          >
            All
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-white">Loading...</div>
      ) : mode === "ai-moderation" ? (
        // AI Moderation Queue View
        flaggedListings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No {filter} flagged listings found
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedListings.map((item) => (
              <div
                key={item.moderation_id}
                className="glass-card rounded-lg border border-dark-border bg-dark-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header with confidence score */}
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="text-lg font-semibold text-white">
                        {item.listing_title}
                      </span>
                      <span className="ml-auto text-sm font-medium text-naija-green">
                        ₦{item.listing_price.toLocaleString()}
                      </span>
                    </div>

                    {/* Confidence Score */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          Confidence Score:
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            item.confidence_score > 85
                              ? "text-red-500"
                              : item.confidence_score > 60
                                ? "text-yellow-500"
                                : "text-blue-500"
                          }`}
                        >
                          {item.confidence_score.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            item.confidence_score > 85
                              ? "bg-red-500"
                              : item.confidence_score > 60
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${item.confidence_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Violations */}
                    {item.violations && item.violations.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-300 mb-2">
                          Violations Detected:
                        </p>
                        <div className="space-y-2">
                          {item.violations.map((violation, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2 bg-dark-bg rounded"
                            >
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded ${getSeverityBadge(violation.severity)}`}
                              >
                                {violation.severity.toUpperCase()}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                  {violation.type.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {violation.details}
                                </p>
                                {violation.confidence && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Confidence:{" "}
                                    {violation.confidence.toFixed(1)}%
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seller Info */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">
                        Seller: {item.seller_username} ({item.seller_email})
                      </p>
                      <p className="text-xs text-gray-500">
                        Flagged: {formatRelativeTime(item.flagged_at)}
                      </p>
                    </div>

                    {/* Admin Notes Input */}
                    {filter === "pending" && (
                      <div className="mt-3">
                        <label className="text-xs text-gray-400 block mb-1">
                          Admin Notes (optional):
                        </label>
                        <textarea
                          className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm text-white"
                          rows={2}
                          placeholder="Add notes about your decision..."
                          value={adminNotes[item.moderation_id] || ""}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({
                              ...prev,
                              [item.moderation_id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {filter === "pending" && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleModerationReview(item.moderation_id, "approve")
                        }
                        disabled={reviewingId === item.moderation_id}
                        title="Approve listing"
                        className="whitespace-nowrap"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleModerationReview(item.moderation_id, "reject")
                        }
                        disabled={reviewingId === item.moderation_id}
                        title="Reject listing"
                        className="whitespace-nowrap"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(`/listing/${item.listing_id}`, "_blank")
                        }
                        title="View listing"
                        className="whitespace-nowrap"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center">
                <Button onClick={() => setPage(page + 1)} variant="outline">
                  Load More
                </Button>
              </div>
            )}
          </div>
        )
      ) : // Original Reports View
      reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No {filter} reports found
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="glass-card rounded-lg border border-dark-border bg-dark-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-naija-green">
                      {report.reason}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(report.created_at)}
                    </span>
                  </div>

                  {report.listing && (
                    <div className="mb-3">
                      <p className="text-white font-medium">
                        {report.listing.title}
                      </p>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                  )}

                  {report.reporter && (
                    <p className="text-xs text-gray-500">
                      Reported by: {report.reporter.username} (
                      {report.reporter.email})
                    </p>
                  )}

                  {report.admin_notes && (
                    <div className="mt-2 p-2 bg-dark-bg rounded text-sm text-gray-300">
                      <span className="font-medium">Admin notes:</span>{" "}
                      {report.admin_notes}
                    </div>
                  )}
                </div>

                {filter === "pending" && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAction(report.id, "approve", "reviewed")
                      }
                      title="Approve listing"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleAction(report.id, "remove", "resolved")
                      }
                      title="Remove listing"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    {report.listing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(`/listing/${report.listing_id}`, "_blank")
                        }
                        title="View listing"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={() => setPage(page + 1)} variant="outline">
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
