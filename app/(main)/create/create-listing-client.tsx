"use client";

import { DynamicListingCreationWizard } from "@/lib/utils/dynamic-imports";

interface CreateListingClientProps {
  categories: any[];
  subcategories: any[];
  userId: string;
  nigerianStates: string[];
}

export function CreateListingClient({
  categories,
  subcategories,
  userId,
  nigerianStates,
}: CreateListingClientProps) {
  return (
    <DynamicListingCreationWizard
      categories={categories}
      subcategories={subcategories}
      userId={userId}
      nigerianStates={nigerianStates}
    />
  );
}
