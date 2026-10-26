import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateListingClient } from "./create-listing-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Kano",
  "Rivers",
  "Oyo",
  "Kaduna",
  "Anambra",
];

function CreateListingLoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-card p-8 rounded-xl space-y-8">
        {/* Progress indicator skeleton */}
        <div className="flex justify-between mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              {i < 3 && <Skeleton className="w-16 h-1 mx-2" />}
            </div>
          ))}
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex justify-between pt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

export default async function CreateListingPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  if (catError) {
    console.error("Error fetching categories:", catError);
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading categories</p>
          <p className="text-gray-400 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  // Fetch subcategories
  const { data: subcategories, error: subError } = await supabase
    .from("subcategories")
    .select("*")
    .order("display_order");

  if (subError) {
    console.error("Error fetching subcategories:", subError);
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading subcategories</p>
          <p className="text-gray-400 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          Create New Listing
        </h1>
        <Suspense fallback={<CreateListingLoadingSkeleton />}>
          <CreateListingClient
            categories={categories || []}
            subcategories={subcategories || []}
            userId={user.id}
            nigerianStates={NIGERIAN_STATES}
          />
        </Suspense>
      </div>
    </div>
  );
}
