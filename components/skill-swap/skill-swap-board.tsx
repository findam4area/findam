"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Star, Clock, Users, ArrowRight } from "lucide-react";
import { SkillOffer } from "@/lib/services/skill-swap";

interface SkillSwapBoardProps {
  onSelectOffer?: (offer: SkillOffer) => void;
  onCreateOffer?: () => void;
}

const SKILL_CATEGORIES = [
  { value: "graphic_design", label: "Graphic Design" },
  { value: "tutoring", label: "Tutoring" },
  { value: "photography", label: "Photography" },
  { value: "tech_support", label: "Tech Support" },
  { value: "writing", label: "Writing" },
  { value: "translation", label: "Translation" },
  { value: "video_editing", label: "Video Editing" },
  { value: "music", label: "Music" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
];

export function SkillSwapBoard({
  onSelectOffer,
  onCreateOffer,
}: SkillSwapBoardProps) {
  const [offers, setOffers] = useState<SkillOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showExchangeOnly, setShowExchangeOnly] = useState(false);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (showExchangeOnly) params.append("open_to_exchange", "true");

      const response = await fetch(`/api/skill-offers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error("Failed to fetch skill offers:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showExchangeOnly]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const filteredOffers = offers.filter((offer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      offer.title.toLowerCase().includes(query) ||
      offer.description.toLowerCase().includes(query) ||
      offer.skill_tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skill Swap</h1>
          <p className="mt-1 text-gray-600">
            Exchange skills and services with other users
          </p>
        </div>
        {onCreateOffer && (
          <button
            type="button"
            onClick={onCreateOffer}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Offer Your Skills
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              title="Filter by category"
              className="w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Only Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showExchangeOnly}
              onChange={(e) => setShowExchangeOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Open to exchange only</span>
          </label>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No skill offers found
          </h3>
          <p className="mt-2 text-gray-600">
            Try adjusting your filters or be the first to offer your skills!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <SkillOfferCard
              key={offer.id}
              offer={offer}
              onSelect={() => onSelectOffer?.(offer)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SkillOfferCardProps {
  offer: SkillOffer;
  onSelect?: () => void;
}

function SkillOfferCard({ offer, onSelect }: SkillOfferCardProps) {
  const categoryLabel =
    SKILL_CATEGORIES.find((c) => c.value === offer.category)?.label ||
    offer.category;

  return (
    <div className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-2 flex items-start justify-between">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            {categoryLabel}
          </span>
          {offer.open_to_exchange && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Open to Swap
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
      </div>

      {/* Description */}
      <p className="mb-4 line-clamp-3 text-sm text-gray-600">
        {offer.description}
      </p>

      {/* Skills Tags */}
      {offer.skill_tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {offer.skill_tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
            >
              {tag}
            </span>
          ))}
          {offer.skill_tags.length > 3 && (
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
              +{offer.skill_tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600">
        {offer.rating > 0 && (
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{offer.rating.toFixed(1)}</span>
            <span>({offer.review_count})</span>
          </div>
        )}
        {offer.exchange_count > 0 && (
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{offer.exchange_count} exchanges</span>
          </div>
        )}
      </div>

      {/* Pricing */}
      {offer.hourly_rate && (
        <div className="mb-4 flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            ₦{offer.hourly_rate.toLocaleString()}/hour
          </span>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        <span>View Details</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
