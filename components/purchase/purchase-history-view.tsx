"use client";

/**
 * Purchase History View Component
 * Displays user's purchase history with filtering and reorder functionality
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface PurchaseRecord {
  id: string;
  amount: number;
  quantity: number;
  delivery_status: string;
  tracking_number?: string;
  warranty_expires_at?: Date;
  purchased_at: Date;
  delivered_at?: Date;
  listing?: {
    id: string;
    title: string;
    price: number;
    thumbnail_url: string | null;
    category_id: string;
    is_active: boolean;
  };
  seller?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface SpendingAnalytics {
  totalSpending: number;
  monthlySpending: Record<string, number>;
  yearlySpending: Record<string, number>;
  averageOrderValue: number;
  totalOrders: number;
}

export function PurchaseHistoryView() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (deliveryStatus) params.append("deliveryStatus", deliveryStatus);

        const response = await fetch(`/api/purchase-history?${params}`);
        if (!response.ok) throw new Error("Failed to fetch purchase history");

        const data = await response.json();
        setPurchases(data.purchases || []);
      } catch (error) {
        console.error("Error fetching purchase history:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/purchase-history/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics");

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchPurchaseHistory();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (deliveryStatus) params.append("deliveryStatus", deliveryStatus);

      const response = await fetch(`/api/purchase-history?${params}`);
      if (!response.ok) throw new Error("Failed to fetch purchase history");

      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (error) {
      console.error("Error fetching purchase history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/purchase-history/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleReorder = async (purchaseId: string) => {
    try {
      const response = await fetch(
        `/api/purchase-history/${purchaseId}/reorder`,
        {
          method: "POST",
        },
      );

      if (!response.ok) throw new Error("Failed to reorder");

      const data = await response.json();

      if (data.available && data.listing) {
        // Redirect to listing page
        window.location.href = `/listing/${data.listing.id}`;
      } else {
        // Show suggestions modal
        alert(
          data.reason +
            (data.suggestions?.length
              ? "\n\nWe found similar items you might like!"
              : ""),
        );
      }
    } catch (error) {
      console.error("Error reordering:", error);
      alert("Failed to reorder item");
    }
  };

  const applyFilters = () => {
    fetchPurchaseHistory();
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setMinPrice("");
    setMaxPrice("");
    setDeliveryStatus("");
    fetchPurchaseHistory();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_transit":
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "cancelled":
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading purchase history...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Purchase History</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && analytics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spending Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Total Spending</span>
              </div>
              <p className="text-2xl font-bold">
                ₦{analytics.totalSpending.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-sm">Total Orders</span>
              </div>
              <p className="text-2xl font-bold">{analytics.totalOrders}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Average Order</span>
              </div>
              <p className="text-2xl font-bold">
                ₦{analytics.averageOrderValue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters Section */}
      {showFilters && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="minPrice">Min Price (₦)</Label>
              <Input
                id="minPrice"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Max Price (₦)</Label>
              <Input
                id="maxPrice"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="1000000"
              />
            </div>
            <div>
              <Label htmlFor="deliveryStatus">Delivery Status</Label>
              <select
                id="deliveryStatus"
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                aria-label="Filter by delivery status"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Purchase List */}
      {purchases.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
            <p className="text-muted-foreground">
              Your purchase history will appear here
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {purchase.listing?.thumbnail_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <Image
                        src={purchase.listing.thumbnail_url}
                        alt={purchase.listing.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Purchase Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg truncate">
                        {purchase.listing?.title || "Item Unavailable"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Seller: @{purchase.seller?.username || "Unknown"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ₦{purchase.amount.toLocaleString()}
                      </p>
                      {purchase.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          Qty: {purchase.quantity}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(purchase.purchased_at), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(purchase.delivery_status)}
                      {getStatusText(purchase.delivery_status)}
                    </div>
                    {purchase.tracking_number && (
                      <div className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Tracking: {purchase.tracking_number}
                      </div>
                    )}
                  </div>

                  {purchase.warranty_expires_at && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Warranty expires:{" "}
                      {format(
                        new Date(purchase.warranty_expires_at),
                        "MMM dd, yyyy",
                      )}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReorder(purchase.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reorder
                    </Button>
                    {purchase.listing?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          (window.location.href = `/listing/${purchase.listing?.id}`)
                        }
                      >
                        View Item
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
