import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessProfileForm } from "@/components/business";
import { PhotoUploader } from "@/components/business";
import type { Category } from "@/lib/types/category";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCategories() {
  const supabase = await createClient();
  
  const { data: mainCategories, error } = await supabase
    .from("categories")
    .select(`
      *,
      subcategories:categories!parent_id(*)
    `)
    .is("parent_id", null)
    .order("display_order");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return (mainCategories || []) as unknown as Category[];
}

async function getBusinessProfile(id: string, userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Fetch secondary category tags separately
  const { data: secondaryTags } = await supabase
    .from("business_category_tags")
    .select("category_id, subcategory_ids, is_primary")
    .eq("business_profile_id", id)
    .eq("is_primary", false);

  return {
    ...profile,
    secondary_categories: (secondaryTags || []).map(tag => ({
      category_id: tag.category_id,
      subcategory_ids: tag.subcategory_ids,
    })),
  } as any;
}

export const metadata = {
  title: "Edit Business Profile | FindAm",
};

export default async function EditBusinessProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/business-profiles/${id}/edit`);
  }

  const profile = await getBusinessProfile(id, user.id);

  if (!profile) {
    notFound();
  }

  const categories = await getCategories();

  const handleSubmit = async (data: any) => {
    "use server";
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Update business profile
    const { error } = await supabase
      .from("business_profiles")
      .update({
        business_name: data.business_name,
        description: data.description,
        business_type: data.business_type,
        primary_category_id: data.primary_category_id,
        primary_subcategory_ids: data.primary_subcategory_ids,
        city: data.city,
        state: data.state,
        address: data.address,
        postal_code: data.postal_code,
        phone: data.phone,
        email: data.email,
        website: data.website,
        business_hours: data.business_hours,
        service_attributes: data.service_attributes,
        price_range: data.price_range,
        category_specific_fields: data.category_specific_fields,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    // Update category tags
    // Delete existing secondary tags
    await supabase
      .from("business_category_tags")
      .delete()
      .eq("business_profile_id", id);

    // Insert updated tags
    const tags = [
      {
        business_profile_id: id,
        category_id: data.primary_category_id,
        subcategory_ids: data.primary_subcategory_ids,
        is_primary: true,
      },
      ...(data.secondary_categories || []).map((cat: any) => ({
        business_profile_id: id,
        category_id: cat.category_id,
        subcategory_ids: cat.subcategory_ids,
        is_primary: false,
      })),
    ];

    await supabase.from("business_category_tags").insert(tags);

    redirect(`/business-profiles/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Business Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Update your business information and improve your profile
        </p>
      </div>

      <BusinessProfileForm
        categories={categories}
        initialData={profile}
        onSubmit={handleSubmit}
        isEditing
      />
    </div>
  );
}
