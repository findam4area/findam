"use client";

import { CategoryBusinessList } from "./CategoryBusinessList";
import { useRouter, useSearchParams } from "next/navigation";
import type { BusinessProfile } from "@/lib/types/business-profile";

interface CategoryBusinessListWrapperProps {
  initialBusinesses: BusinessProfile[];
  initialTotal: number;
  initialPage: number;
  initialLimit: number;
  initialSortBy: "rating" | "review_count" | "name";
  categoryId: string;
  subcategoryId?: string;
}

/**
 * Client-side wrapper for CategoryBusinessList to handle URL updates
 * Enables sorting and pagination without full page reloads
 */
export function CategoryBusinessListWrapper({
  initialBusinesses,
  initialTotal,
  initialPage,
  initialLimit,
  initialSortBy,
  categoryId,
  subcategoryId,
}: CategoryBusinessListWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: "rating" | "review_count" | "name") => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", newSort);
    params.set("page", "1"); // Reset to first page when sorting changes
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
    
    // Scroll to top of page when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <CategoryBusinessList
      businesses={initialBusinesses}
      total={initialTotal}
      page={initialPage}
      limit={initialLimit}
      sortBy={initialSortBy}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
    />
  );
}
