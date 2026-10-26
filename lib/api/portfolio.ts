/**
 * Portfolio API
 * Handles portfolio item management for service providers and CV/skills for job seekers
 */

import { createClient } from "@/lib/supabase/client";
import { PortfolioItem } from "@/lib/types";

/**
 * Get portfolio items for a user
 */
export async function getPortfolioItems(
  userId: string,
): Promise<PortfolioItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch portfolio items: ${error.message}`);
  }

  return (data || []) as PortfolioItem[];
}

/**
 * Create a new portfolio item
 */
export async function createPortfolioItem(
  portfolioData: Omit<PortfolioItem, "id" | "created_at">,
): Promise<PortfolioItem> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert(portfolioData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create portfolio item: ${error.message}`);
  }

  return data as PortfolioItem;
}

/**
 * Update a portfolio item
 */
export async function updatePortfolioItem(
  id: string,
  updates: Partial<Omit<PortfolioItem, "id" | "user_id" | "created_at">>,
): Promise<PortfolioItem> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("portfolio_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update portfolio item: ${error.message}`);
  }

  return data as PortfolioItem;
}

/**
 * Delete a portfolio item
 */
export async function deletePortfolioItem(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete portfolio item: ${error.message}`);
  }
}

/**
 * Upload portfolio media to Supabase Storage
 */
export async function uploadPortfolioMedia(
  file: File,
  userId: string,
): Promise<string> {
  const supabase = createClient();

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("portfolio")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload portfolio media: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("portfolio").getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Upload CV to Supabase Storage
 */
export async function uploadCV(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  // Generate unique filename for CV
  const fileExt = file.name.split(".").pop();
  const fileName = `cvs/${userId}/cv-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("portfolio")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true, // Allow updating CV
    });

  if (error) {
    throw new Error(`Failed to upload CV: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("portfolio").getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Update user CV URL
 */
export async function updateUserCV(
  userId: string,
  cvUrl: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .update({ cv_url: cvUrl })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update user CV: ${error.message}`);
  }
}

/**
 * Update user skills
 */
export async function updateUserSkills(
  userId: string,
  skills: string[],
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .update({ skills })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update user skills: ${error.message}`);
  }
}

/**
 * Update user service provider status
 */
export async function updateServiceProviderStatus(
  userId: string,
  isServiceProvider: boolean,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_service_provider: isServiceProvider })
    .eq("id", userId);

  if (error) {
    throw new Error(
      `Failed to update service provider status: ${error.message}`,
    );
  }
}

/**
 * Update user job seeker status
 */
export async function updateJobSeekerStatus(
  userId: string,
  isJobSeeker: boolean,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_job_seeker: isJobSeeker })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update job seeker status: ${error.message}`);
  }
}

/**
 * Reorder portfolio items
 */
export async function reorderPortfolioItems(
  items: { id: string; display_order: number }[],
): Promise<void> {
  const supabase = createClient();

  // Update each item's display order
  const updates = items.map((item) =>
    supabase
      .from("portfolio_items")
      .update({ display_order: item.display_order })
      .eq("id", item.id),
  );

  const results = await Promise.all(updates);

  const errors = results.filter((result) => result.error);
  if (errors.length > 0) {
    throw new Error(
      `Failed to reorder portfolio items: ${errors[0].error?.message}`,
    );
  }
}
