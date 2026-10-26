"use client";

import { useState } from "react";
import { Upload, Palette, Save, X } from "lucide-react";
import type { Storefront, Listing } from "@/lib/types";

interface StorefrontCustomizerProps {
  storefront: Storefront;
  listings: Listing[];
  onUpdate?: (storefront: Storefront) => void;
}

export function StorefrontCustomizer({
  storefront,
  listings,
  onUpdate,
}: StorefrontCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: storefront.display_name || "",
    bio: storefront.bio || "",
    banner_url: storefront.banner_url || "",
    theme_color: storefront.theme_color || "#3B82F6",
    featured_listings: storefront.featured_listings || [],
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/storefront", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update storefront");
      }

      const { storefront: updated } = await response.json();
      onUpdate?.(updated);
      setIsOpen(false);
      alert("Storefront updated successfully!");
      window.location.reload(); // Refresh to show changes
    } catch (error) {
      console.error("Failed to update storefront:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update storefront",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeaturedListing = (listingId: string) => {
    const featured = formData.featured_listings || [];
    if (featured.includes(listingId)) {
      setFormData({
        ...formData,
        featured_listings: featured.filter((id) => id !== listingId),
      });
    } else {
      if (featured.length >= 6) {
        alert("Maximum 6 featured listings allowed");
        return;
      }
      setFormData({
        ...formData,
        featured_listings: [...featured, listingId],
      });
    }
  };

  const predefinedColors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 p-4 text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Customize storefront"
      >
        <Palette className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Customize Storefront
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close customizer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder="Your store name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell customers about your store..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Banner URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Banner Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.banner_url}
                onChange={(e) =>
                  setFormData({ ...formData, banner_url: e.target.value })
                }
                placeholder="https://example.com/banner.jpg"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
              <button
                className="rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200"
                aria-label="Upload banner image"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
            {formData.banner_url && (
              <img
                src={formData.banner_url}
                alt="Banner preview"
                className="mt-2 h-32 w-full rounded-lg object-cover"
              />
            )}
          </div>

          {/* Theme Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Theme Color
            </label>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setFormData({ ...formData, theme_color: color })
                  }
                  className="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      formData.theme_color === color ? "#000" : "transparent",
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
              <input
                type="color"
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({ ...formData, theme_color: e.target.value })
                }
                className="h-10 w-10 cursor-pointer rounded-full border-2"
                aria-label="Custom color picker"
              />
            </div>
          </div>

          {/* Featured Listings */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Featured Products (Max 6)
            </label>
            <p className="mb-3 text-sm text-gray-600">
              Select up to 6 products to feature at the top of your storefront
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
              {listings.map((listing) => (
                <label
                  key={listing.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.featured_listings?.includes(listing.id)}
                    onChange={() => toggleFeaturedListing(listing.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <img
                    src={listing.thumbnail_url || "/placeholder-listing.jpg"}
                    alt={listing.title}
                    className="h-12 w-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {listing.title}
                    </p>
                    {listing.price && (
                      <p className="text-sm text-gray-600">
                        ₦{listing.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
