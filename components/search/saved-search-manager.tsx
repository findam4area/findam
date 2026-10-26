"use client";

/**
 * SavedSearchManager Component
 * Allows users to create, view, and manage saved searches
 */

import { useState, useEffect } from "react";
import { Search, Bell, BellOff, Trash2, Edit2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { SavedSearch, SavedSearchQuery } from "@/lib/services/alert";

interface SavedSearchManagerProps {
  userId: string;
  onSearchClick?: (search: SavedSearch) => void;
}

export function SavedSearchManager({
  userId,
  onSearchClick,
}: SavedSearchManagerProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);

  // Form state for creating/editing saved search
  const [searchName, setSearchName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [notificationFrequency, setNotificationFrequency] = useState<
    "instant" | "daily" | "weekly"
  >("instant");

  const loadSavedSearches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/alerts/saved-searches?userId=${userId}`,
      );
      if (!response.ok) throw new Error("Failed to load saved searches");
      const data = await response.json();
      setSavedSearches(data.savedSearches || []);
    } catch (error) {
      console.error("Error loading saved searches:", error);
      toast.error("Failed to load saved searches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleCreateSearch = async () => {
    if (!searchName.trim()) {
      toast.error("Please enter a name for your saved search");
      return;
    }

    try {
      const query: SavedSearchQuery = {
        keywords: keywords.trim() || undefined,
        priceRange:
          minPrice && maxPrice
            ? {
                min: parseFloat(minPrice),
                max: parseFloat(maxPrice),
              }
            : undefined,
      };

      const response = await fetch("/api/alerts/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: searchName,
          query,
          notificationFrequency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create saved search");
      }

      toast.success("Saved search created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
      loadSavedSearches();
    } catch (error: any) {
      console.error("Error creating saved search:", error);
      toast.error(error.message || "Failed to create saved search");
    }
  };

  const handleUpdateSearch = async (
    searchId: string,
    updates: Partial<SavedSearch>,
  ) => {
    try {
      const response = await fetch(`/api/alerts/saved-searches/${searchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update saved search");

      toast.success("Saved search updated");
      loadSavedSearches();
    } catch (error) {
      console.error("Error updating saved search:", error);
      toast.error("Failed to update saved search");
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm("Are you sure you want to delete this saved search?")) return;

    try {
      const response = await fetch(`/api/alerts/saved-searches/${searchId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete saved search");

      toast.success("Saved search deleted");
      loadSavedSearches();
    } catch (error) {
      console.error("Error deleting saved search:", error);
      toast.error("Failed to delete saved search");
    }
  };

  const handleTogglePause = async (search: SavedSearch) => {
    await handleUpdateSearch(search.id, { is_paused: !search.is_paused });
  };

  const resetForm = () => {
    setSearchName("");
    setKeywords("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setNotificationFrequency("instant");
    setEditingSearch(null);
  };

  const formatQuery = (query: SavedSearchQuery): string => {
    const parts: string[] = [];
    if (query.keywords) parts.push(query.keywords);
    if (query.priceRange) {
      const { min, max } = query.priceRange;
      if (min && max)
        parts.push(`₦${min.toLocaleString()} - ₦${max.toLocaleString()}`);
      else if (min) parts.push(`from ₦${min.toLocaleString()}`);
      else if (max) parts.push(`up to ₦${max.toLocaleString()}`);
    }
    return parts.join(" • ") || "All listings";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Searches</h2>
          <p className="text-sm text-muted-foreground">
            Get notified when new listings match your criteria
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              New Search
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Saved Search</DialogTitle>
              <DialogDescription>
                Set up alerts for listings that match your criteria
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Search Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., iPhone 13 in Lagos"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., iPhone 13 Pro"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  placeholder="e.g., Electronics"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Min Price (₦)</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Max Price (₦)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="1000000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select
                  value={notificationFrequency}
                  onValueChange={(value: any) =>
                    setNotificationFrequency(value)
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSearch}>Create Search</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saved Searches List */}
      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No saved searches yet
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create a saved search to get notified when new listings match your
              criteria
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {savedSearches.map((search) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    search.is_paused ? "opacity-60" : ""
                  }`}
                  onClick={() => onSearchClick?.(search)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {search.name}
                          {search.new_match_count > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {search.new_match_count} new
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {formatQuery(search.query)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Notifications
                      </span>
                      <Badge variant="outline">
                        {search.notification_frequency}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!search.is_paused}
                          onCheckedChange={() => handleTogglePause(search)}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                        <span className="text-sm text-muted-foreground">
                          {search.is_paused ? "Paused" : "Active"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSearch(search.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
