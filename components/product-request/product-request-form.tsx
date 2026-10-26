"use client";

/**
 * Product Request Form Component
 *
 * Allows buyers to create product requests with title, description, budget, category, and location.
 * Requirements: 19.1, 19.9
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Search, CheckCircle, AlertCircle } from "lucide-react";

interface ProductRequestFormProps {
  onSuccess?: (requestId: string) => void;
  onCancel?: () => void;
}

interface Category {
  id: string;
  name: string;
}

export function ProductRequestForm({
  onSuccess,
  onCancel,
}: ProductRequestFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const supabase = createClient();

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .order("name");

        if (error) throw error;

        setCategories(data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate required fields
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    // Validate budget range
    const minBudget = budgetMin ? parseFloat(budgetMin) : undefined;
    const maxBudget = budgetMax ? parseFloat(budgetMax) : undefined;

    if (minBudget !== undefined && minBudget < 0) {
      setError("Minimum budget must be non-negative");
      return;
    }

    if (maxBudget !== undefined && maxBudget < 0) {
      setError("Maximum budget must be non-negative");
      return;
    }

    if (
      minBudget !== undefined &&
      maxBudget !== undefined &&
      maxBudget < minBudget
    ) {
      setError(
        "Maximum budget must be greater than or equal to minimum budget",
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to create a request");
        return;
      }

      const response = await fetch("/api/product-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId || undefined,
          budget_min: minBudget,
          budget_max: maxBudget,
          preferred_location: preferredLocation.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create request");
      }

      const data = await response.json();
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.(data.id);
      }, 1500);
    } catch (err) {
      console.error("Error creating request:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Request Created!</h3>
          <p className="text-muted-foreground">
            Your product request has been posted. Sellers will be able to submit
            offers.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Create Product Request
          </h3>
          <p className="text-sm text-muted-foreground">
            Tell sellers what you&apos;re looking for and they&apos;ll submit offers
          </p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            What are you looking for? <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., iPhone 13 Pro Max"
            maxLength={200}
            required
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground text-right">
            {title.length}/200
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you're looking for in detail (condition, specifications, etc.)"
            rows={4}
            maxLength={2000}
            required
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/2000
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category (Optional)</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={loadingCategories}
            aria-label="Select product category"
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Range */}
        <div className="space-y-2">
          <Label>Budget Range (Optional)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="Min (₦)"
                min="0"
                step="100"
                aria-label="Minimum budget"
              />
            </div>
            <div>
              <Input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Max (₦)"
                min="0"
                step="100"
                aria-label="Maximum budget"
              />
            </div>
          </div>
          {budgetMin && budgetMax && (
            <p className="text-xs text-muted-foreground">
              Budget: ₦{parseFloat(budgetMin).toLocaleString()} - ₦
              {parseFloat(budgetMax).toLocaleString()}
            </p>
          )}
        </div>

        {/* Preferred Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Preferred Location (Optional)</Label>
          <Input
            id="location"
            value={preferredLocation}
            onChange={(e) => setPreferredLocation(e.target.value)}
            placeholder="e.g., Lagos, Ikeja"
            maxLength={200}
            aria-label="Preferred location for pickup or delivery"
          />
          <p className="text-xs text-muted-foreground">
            Where would you like to pick up or receive the item?
          </p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-blue-900 dark:text-blue-100">
              <p className="font-medium">Your request will:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Be visible to all sellers for 30 days</li>
                <li>Allow sellers to submit offers with their listings</li>
                <li>Notify you when offers are received</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
