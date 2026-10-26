// Trending Sounds Service
// Task 67: Implement Trending Sounds feature

import { createClient } from "@/lib/supabase/client";

export interface TrendingSound {
  id: string;
  title: string;
  artist: string | null;
  audio_url: string;
  duration_seconds: number | null;
  usage_count: number;
  trending_score: number;
  category: string | null;
  tags: string[];
  uploaded_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTrendingSoundData {
  title: string;
  artist?: string;
  audio_url: string;
  duration_seconds?: number;
  category?: string;
  tags?: string[];
}

export interface VideoListingSound {
  id: string;
  listing_id: string;
  sound_id: string;
  created_at: string;
}

export class TrendingSoundsService {
  private supabase = createClient();

  // Get trending sounds with optional category filter
  async getTrendingSounds(
    limit: number = 20,
    category?: string,
  ): Promise<TrendingSound[]> {
    const { data, error } = await (this.supabase.rpc as any)(
      "get_trending_sounds",
      {
        p_limit: limit,
        p_category: category || null,
      },
    );

    if (error) throw error;
    return data || [];
  }

  // Get all sounds (for browsing library)
  async getAllSounds(filters?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ sounds: TrendingSound[]; total: number }> {
    let query = (this.supabase as any)
      .from("trending_sounds")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,artist.ilike.%${filters.search}%`,
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1,
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { sounds: data || [], total: count || 0 };
  }

  // Get sound by ID
  async getSoundById(soundId: string): Promise<TrendingSound | null> {
    const { data, error } = await (this.supabase as any)
      .from("trending_sounds")
      .select("*")
      .eq("id", soundId)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  // Create new trending sound
  async createSound(
    soundData: CreateTrendingSoundData,
  ): Promise<TrendingSound> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase as any)
      .from("trending_sounds")
      .insert({
        ...soundData,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update sound
  async updateSound(
    soundId: string,
    updates: Partial<CreateTrendingSoundData>,
  ): Promise<TrendingSound> {
    const { data, error } = await (this.supabase as any)
      .from("trending_sounds")
      .update(updates)
      .eq("id", soundId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete sound (soft delete)
  async deleteSound(soundId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("trending_sounds")
      .update({ is_active: false })
      .eq("id", soundId);

    if (error) throw error;
  }

  // Link sound to video listing
  async linkSoundToListing(
    listingId: string,
    soundId: string,
  ): Promise<VideoListingSound> {
    const { data, error } = await (this.supabase as any)
      .from("video_listing_sounds")
      .insert({
        listing_id: listingId,
        sound_id: soundId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Unlink sound from video listing
  async unlinkSoundFromListing(
    listingId: string,
    soundId: string,
  ): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("video_listing_sounds")
      .delete()
      .eq("listing_id", listingId)
      .eq("sound_id", soundId);

    if (error) throw error;
  }

  // Get sounds for a listing
  async getListingSounds(listingId: string): Promise<TrendingSound[]> {
    const { data, error } = await (this.supabase as any)
      .from("video_listing_sounds")
      .select(
        `
        sound_id,
        trending_sounds (*)
      `,
      )
      .eq("listing_id", listingId);

    if (error) throw error;
    return data?.map((item: any) => item.trending_sounds).filter(Boolean) || [];
  }

  // Get listings using a sound
  async getListingsUsingSoun(soundId: string): Promise<string[]> {
    const { data, error } = await (this.supabase as any)
      .from("video_listing_sounds")
      .select("listing_id")
      .eq("sound_id", soundId);

    if (error) throw error;
    return data?.map((item: any) => item.listing_id) || [];
  }

  // Update trending scores (admin function)
  async updateTrendingScores(): Promise<void> {
    const { error } = await (this.supabase as any).rpc("update_trending_score");
    if (error) throw error;
  }

  // Get sounds by category
  async getSoundsByCategory(category: string): Promise<TrendingSound[]> {
    const { data, error } = await (this.supabase as any)
      .from("trending_sounds")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("trending_score", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  // Search sounds
  async searchSounds(query: string): Promise<TrendingSound[]> {
    const { data, error } = await (this.supabase as any)
      .from("trending_sounds")
      .select("*")
      .eq("is_active", true)
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%,tags.cs.{${query}}`)
      .order("trending_score", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }
}
