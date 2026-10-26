"use client";

/**
 * Requests Feed Component
 *
 * Displays all active product requests for sellers to browse and submit offers.
 * Requirements: 19.2, 19.8, 19.10
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Clock,
  MapPin,
  DollarSign,
  MessageSquare,
  Filter,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductRequest {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  status: "active" | "fulfilled" | "expired";
  offers_count: number;
  expires_at: string;
  created_at: string;
  users: {
    username: string;
    avatar_url: string | null;
    trust_score: number;
  };
  categories: {
    name: string;
  } | null;
}

interface RequestsFeedProps {
  onRequestClick?: (requestId: string) => void;
}

export function RequestsFeed({ onRequestClick }: RequestsFeedProps) {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch requests
  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append("category_id", selectedCategory);
        if (searchQuery) params.append("search", searchQuery);

        const response = await fetch(
          `/api/product-requests?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }

        const data = await response.json();
        setRequests(data.requests || []);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load product requests");
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [selectedCategory, searchQuery]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffInDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays < 1) return "Expires soon";
    if (diffInDays === 1) return "1 day left";
    return `${diffInDays} days left`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-3" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-4"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search product requests"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Requests list */}
      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No requests found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory
              ? "Try adjusting your filters"
              : "No active product requests at the moment"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onRequestClick?.(request.id)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-1 truncate">
                      {request.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>by {request.users.username}</span>
                      {request.categories && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {request.categories.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {request.description}
                </p>

                {/* Details */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {/* Budget */}
                  {request.budget_min !== null &&
                    request.budget_max !== null && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          ₦{request.budget_min.toLocaleString()} - ₦
                          {request.budget_max.toLocaleString()}
                        </span>
                      </div>
                    )}

                  {/* Location */}
                  {request.preferred_location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{request.preferred_location}</span>
                    </div>
                  )}

                  {/* Time remaining */}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getTimeRemaining(request.expires_at)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>
                      {request.offers_count}{" "}
                      {request.offers_count === 1 ? "offer" : "offers"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(request.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
