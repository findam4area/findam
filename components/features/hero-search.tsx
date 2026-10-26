"use client";

/**
 * HeroSearch Client Component
 * 
 * Provides search functionality in the hero section with:
 * - Real-time search input
 * - Category filter dropdown
 * - Search submission handling
 * - Keyboard navigation support
 * 
 * Requirements: 9.5, 9.6, 9.7
 */

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/types/core";

interface HeroSearchProps {
  categories: Category[];
}

export function HeroSearch({ categories }: HeroSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Build query parameters
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.set("search_query", searchQuery.trim());
    }
    
    if (categoryId) {
      params.set("category_id", categoryId);
    }

    // Navigate to browse page with filters
    const queryString = params.toString();
    router.push(`/browse${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for services, products, opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-300 focus:bg-white/20 focus:border-primary-500"
          />
        </div>

        {/* Category filter */}
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full sm:w-[200px] h-14 bg-white/10 backdrop-blur-sm border-white/20 text-white focus:bg-white/20 focus:border-primary-500">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search button */}
        <Button
          type="submit"
          size="lg"
          variant="neon"
          className="h-14 px-8 font-semibold"
        >
          <Search className="mr-2 h-5 w-5" />
          Search
        </Button>
      </div>
    </form>
  );
}
