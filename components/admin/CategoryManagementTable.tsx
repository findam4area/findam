"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Merge,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_hidden: boolean;
  parent_id: string | null;
  subcategories?: Category[];
  business_count?: number;
}

/**
 * CategoryManagementTable Component
 * Task 23.2: Create CategoryManagementTable component
 * Requirements: 19.3, 19.4, 19.5, 19.6
 * 
 * Features:
 * - Display all categories in table with subcategories
 * - Reorder controls for display_order
 * - Hide/unhide toggle for each category
 * - Merge categories button
 * - Call reorder and hide endpoints
 */
export function CategoryManagementTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Merge dialog state
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [sourceCategory, setSourceCategory] = useState<string>("");
  const [targetCategory, setTargetCategory] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleReorder = async (categoryId: string, direction: "up" | "down") => {
    const category = findCategory(categories, categoryId);
    if (!category) return;

    const newDisplayOrder =
      direction === "up" ? category.display_order - 1 : category.display_order + 1;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_order: newDisplayOrder,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder category");
      }

      showSuccess("Category reordered successfully");
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder category");
    }
  };

  const handleToggleHidden = async (categoryId: string, currentHiddenState: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/hide`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_hidden: !currentHiddenState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category visibility");
      }

      showSuccess(
        `Category ${!currentHiddenState ? "hidden" : "unhidden"} successfully`
      );
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update category visibility"
      );
    }
  };

  const handleMerge = async () => {
    if (!sourceCategory || !targetCategory || sourceCategory === targetCategory) {
      setError("Please select valid source and target categories");
      return;
    }

    setIsMerging(true);
    try {
      const response = await fetch(`/api/admin/categories/${sourceCategory}/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_category_id: targetCategory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to merge categories");
      }

      const result = await response.json();
      showSuccess(
        `Successfully merged categories. ${result.businesses_moved} businesses moved.`
      );
      setIsMergeDialogOpen(false);
      setSourceCategory("");
      setTargetCategory("");
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to merge categories");
    } finally {
      setIsMerging(false);
    }
  };

  const findCategory = (
    cats: Category[],
    id: string
  ): Category | undefined => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.subcategories) {
        const found = findCategory(cat.subcategories, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const getAllCategoriesFlat = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    for (const cat of cats) {
      result.push(cat);
      if (cat.subcategories) {
        result.push(...getAllCategoriesFlat(cat.subcategories));
      }
    }
    return result;
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={cn(
            "flex items-center gap-2 p-3 border-b hover:bg-muted/50 transition-colors",
            category.is_hidden && "opacity-50"
          )}
          style={{ paddingLeft: `${level * 2 + 0.75}rem` }}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-6">
            {hasSubcategories && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="hover:bg-muted rounded p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Category Name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{category.name}</div>
            {category.business_count !== undefined && (
              <div className="text-xs text-muted-foreground">
                {category.business_count} businesses
              </div>
            )}
          </div>

          {/* Display Order */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <GripVertical className="w-4 h-4" />
            <span className="w-8 text-center">{category.display_order}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Reorder Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReorder(category.id, "up")}
              disabled={category.display_order === 0}
              title="Move up"
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReorder(category.id, "down")}
              title="Move down"
            >
              ↓
            </Button>

            {/* Hide/Unhide Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleHidden(category.id, category.is_hidden)}
              title={category.is_hidden ? "Unhide" : "Hide"}
            >
              {category.is_hidden ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Render Subcategories */}
        {hasSubcategories && isExpanded && (
          <div>
            {category.subcategories!.map((subcat) =>
              renderCategory(subcat, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const allCategoriesFlat = getAllCategoriesFlat(categories);

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Manage category hierarchy, display order, and visibility
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsMergeDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Merge className="w-4 h-4" />
              Merge Categories
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Categories Table */}
          {categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No categories found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center gap-2 p-3 bg-muted font-semibold text-sm border-b">
                <div className="w-6"></div>
                <div className="flex-1">Category</div>
                <div className="w-20 text-center">Order</div>
                <div className="w-32 text-center">Actions</div>
              </div>

              {/* Categories */}
              <div className="max-h-[600px] overflow-y-auto">
                {categories.map((category) => renderCategory(category))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Categories Dialog */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Categories</DialogTitle>
            <DialogDescription>
              Merge a source category into a target category. All businesses from the
              source category will be moved to the target category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source Category (will be deleted)</Label>
              <Select value={sourceCategory} onValueChange={setSourceCategory}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategoriesFlat.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.business_count || 0} businesses)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Category (will receive businesses)</Label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger id="target">
                  <SelectValue placeholder="Select target category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategoriesFlat
                    .filter((cat) => cat.id !== sourceCategory)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.business_count || 0} businesses)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {sourceCategory && targetCategory && sourceCategory !== targetCategory && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will move all businesses from{" "}
                  <strong>
                    {allCategoriesFlat.find((c) => c.id === sourceCategory)?.name}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {allCategoriesFlat.find((c) => c.id === targetCategory)?.name}
                  </strong>
                  . This action cannot be undone.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMergeDialogOpen(false)}
              disabled={isMerging}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={
                !sourceCategory ||
                !targetCategory ||
                sourceCategory === targetCategory ||
                isMerging
              }
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                "Merge Categories"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
