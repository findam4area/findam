import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BusinessCreationForm } from "@/components/business/business-creation-form";
import { states as getAllStates } from "nigeria-states-lgas";

// Requirements: 21.1 - Business owners can create verified profiles

export default async function CreateBusinessPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/business-profiles/create");
  }

  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
    throw new Error("Failed to load categories");
  }

  // Get Nigerian states
  const nigerianStates = getAllStates();

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your Business Profile
          </h1>
          <p className="text-gray-600 mt-2">
            Create a verified business profile to build trust with customers and grow
            your business on FindAm.
          </p>
        </div>

        <BusinessCreationForm
          categories={categories || []}
          nigerianStates={nigerianStates}
        />
      </div>
    </div>
  );
}
