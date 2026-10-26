"use client";

import { useState, useEffect } from "react";
import { Search, Play, Pause, TrendingUp, Music, Filter } from "lucide-react";
import { TrendingSound } from "@/lib/services/trending-sounds";

interface TrendingSoundsLibraryProps {
  onSelectSound?: (sound: TrendingSound) => void;
  selectedSoundId?: string;
}

const SOUND_CATEGORIES = [
  "Pop",
  "Hip Hop",
  "Electronic",
  "Rock",
  "R&B",
  "Afrobeats",
  "Jazz",
  "Classical",
  "Other",
];

export function TrendingSoundsLibrary({
  onSelectSound,
  selectedSoundId,
}: TrendingSoundsLibraryProps) {
  const [sounds, setSounds] = useState<TrendingSound[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showTrendingOnly, setShowTrendingOnly] = useState(true);

  useEffect(() => {
    fetchSounds();
  }, [selectedCategory, showTrendingOnly]);

  const fetchSounds = async () => {
    setLoading(true);
    try {
      const endpoint = showTrendingOnly
        ? "/api/trending-sounds/trending"
        : "/api/trending-sounds";

      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (!showTrendingOnly && searchQuery)
        params.append("search", searchQuery);

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSounds(data.sounds || []);
      }
    } catch (error) {
      console.error("Failed to fetch sounds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!showTrendingOnly) {
      fetchSounds();
    }
  };

  const filteredSounds = sounds.filter((sound) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sound.title.toLowerCase().includes(query) ||
      sound.artist?.toLowerCase().includes(query) ||
      sound.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const togglePlay = (soundId: string) => {
    if (playingId === soundId) {
      setPlayingId(null);
    } else {
      setPlayingId(soundId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Trending Sounds</h2>
        <p className="mt-1 text-gray-600">
          Browse and select audio clips for your video listings
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
              {SOUND_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Trending Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showTrendingOnly}
              onChange={(e) => setShowTrendingOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Trending only</span>
          </label>
        </div>
      </div>

      {/* Sounds Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : filteredSounds.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Music className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No sounds found
          </h3>
          <p className="mt-2 text-gray-600">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSounds.map((sound) => (
            <SoundCard
              key={sound.id}
              sound={sound}
              isPlaying={playingId === sound.id}
              isSelected={selectedSoundId === sound.id}
              onTogglePlay={() => togglePlay(sound.id)}
              onSelect={() => onSelectSound?.(sound)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SoundCardProps {
  sound: TrendingSound;
  isPlaying: boolean;
  isSelected: boolean;
  onTogglePlay: () => void;
  onSelect: () => void;
}

function SoundCard({
  sound,
  isPlaying,
  isSelected,
  onTogglePlay,
  onSelect,
}: SoundCardProps) {
  return (
    <div
      className={`group rounded-lg border p-4 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:shadow-md"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{sound.title}</h3>
          {sound.artist && (
            <p className="text-sm text-gray-600">{sound.artist}</p>
          )}
        </div>
        {sound.trending_score > 0 && (
          <div className="flex items-center space-x-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
            <TrendingUp className="h-3 w-3" />
            <span>{sound.trending_score.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* Category & Tags */}
      <div className="mb-3 flex flex-wrap gap-2">
        {sound.category && (
          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
            {sound.category}
          </span>
        )}
        {sound.tags.slice(0, 2).map((tag, index) => (
          <span
            key={index}
            className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-3 flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <Music className="h-4 w-4" />
          <span>{sound.usage_count} uses</span>
        </div>
        {sound.duration_seconds && (
          <span>{Math.floor(sound.duration_seconds)}s</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex items-center justify-center rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200"
          aria-label={isPlaying ? "Pause sound" : "Play sound"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-gray-700" />
          ) : (
            <Play className="h-5 w-5 text-gray-700" />
          )}
        </button>
        <button
          type="button"
          onClick={onSelect}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isSelected
              ? "bg-blue-600 text-white"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}
