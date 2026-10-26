/**
 * Skill Swap Service
 * Handles skill exchange and service offerings
 */

import { createClient } from "@/lib/supabase/client";

export interface SkillOffer {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  skill_tags: string[];
  open_to_exchange: boolean;
  hourly_rate: number | null;
  exchange_preferences: {
    preferred_skills?: string[];
    max_hours?: number;
    min_hours?: number;
  };
  portfolio_items: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  availability: {
    days?: string[];
    hours?: string;
    timezone?: string;
  };
  views_count: number;
  exchange_count: number;
  rating: number;
  review_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SkillExchange {
  id: string;
  requester_id: string;
  provider_id: string;
  requester_offer_id: string | null;
  provider_offer_id: string | null;
  requester_skill: string;
  provider_skill: string;
  description: string | null;
  agreed_hours_requester: number;
  agreed_hours_provider: number;
  completed_hours_requester: number;
  completed_hours_provider: number;
  status: string;
  proposed_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  requester_completed: boolean;
  provider_completed: boolean;
  requester_rating: number | null;
  provider_rating: number | null;
  requester_review: string | null;
  provider_review: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSkillOfferData {
  title: string;
  description: string;
  category: string;
  skill_tags: string[];
  open_to_exchange?: boolean;
  hourly_rate?: number;
  exchange_preferences?: {
    preferred_skills?: string[];
    max_hours?: number;
    min_hours?: number;
  };
  portfolio_items?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  availability?: {
    days?: string[];
    hours?: string;
    timezone?: string;
  };
}

export interface ProposeExchangeData {
  provider_id: string;
  requester_offer_id?: string;
  provider_offer_id?: string;
  requester_skill: string;
  provider_skill: string;
  description?: string;
  agreed_hours_requester: number;
  agreed_hours_provider: number;
}

export class SkillSwapService {
  private supabase = createClient();

  /**
   * Create a new skill offer
   */
  async createSkillOffer(
    userId: string,
    data: CreateSkillOfferData,
  ): Promise<SkillOffer | null> {
    try {
      const { data: offer, error } = await (this.supabase.from as any)(
        "skill_offers",
      )
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          category: data.category,
          skill_tags: data.skill_tags,
          open_to_exchange: data.open_to_exchange ?? true,
          hourly_rate: data.hourly_rate || null,
          exchange_preferences: data.exchange_preferences || {},
          portfolio_items: data.portfolio_items || [],
          availability: data.availability || {},
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create skill offer:", error);
        return null;
      }

      return offer;
    } catch (error) {
      console.error("Error creating skill offer:", error);
      return null;
    }
  }

  /**
   * Get skill offer by ID
   */
  async getSkillOffer(offerId: string): Promise<SkillOffer | null> {
    try {
      const { data, error } = await (this.supabase.from as any)("skill_offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (error) {
        console.error("Failed to get skill offer:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting skill offer:", error);
      return null;
    }
  }

  /**
   * Get all skill offers with filters
   */
  async getSkillOffers(filters?: {
    category?: string;
    skill_tags?: string[];
    open_to_exchange?: boolean;
    min_rating?: number;
    limit?: number;
    offset?: number;
  }): Promise<SkillOffer[]> {
    try {
      let query = (this.supabase.from as any)("skill_offers")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.open_to_exchange !== undefined) {
        query = query.eq("open_to_exchange", filters.open_to_exchange);
      }

      if (filters?.min_rating) {
        query = query.gte("rating", filters.min_rating);
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

      const { data, error } = await query;

      if (error) {
        console.error("Failed to get skill offers:", error);
        return [];
      }

      // Filter by skill tags if provided
      if (filters?.skill_tags && filters.skill_tags.length > 0) {
        return (data || []).filter((offer: SkillOffer) =>
          filters.skill_tags!.some((tag) => offer.skill_tags.includes(tag)),
        );
      }

      return data || [];
    } catch (error) {
      console.error("Error getting skill offers:", error);
      return [];
    }
  }

  /**
   * Get user's skill offers
   */
  async getUserSkillOffers(userId: string): Promise<SkillOffer[]> {
    try {
      const { data, error } = await (this.supabase.from as any)("skill_offers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to get user skill offers:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error getting user skill offers:", error);
      return [];
    }
  }

  /**
   * Update skill offer
   */
  async updateSkillOffer(
    offerId: string,
    userId: string,
    updates: Partial<CreateSkillOfferData>,
  ): Promise<boolean> {
    try {
      const { error } = await (this.supabase.from as any)("skill_offers")
        .update(updates)
        .eq("id", offerId)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to update skill offer:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating skill offer:", error);
      return false;
    }
  }

  /**
   * Delete skill offer
   */
  async deleteSkillOffer(offerId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (this.supabase.from as any)("skill_offers")
        .delete()
        .eq("id", offerId)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to delete skill offer:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting skill offer:", error);
      return false;
    }
  }

  /**
   * Propose a skill exchange
   */
  async proposeExchange(
    requesterId: string,
    data: ProposeExchangeData,
  ): Promise<SkillExchange | null> {
    try {
      const { data: exchange, error } = await (this.supabase.from as any)(
        "skill_exchanges",
      )
        .insert({
          requester_id: requesterId,
          provider_id: data.provider_id,
          requester_offer_id: data.requester_offer_id || null,
          provider_offer_id: data.provider_offer_id || null,
          requester_skill: data.requester_skill,
          provider_skill: data.provider_skill,
          description: data.description || null,
          agreed_hours_requester: data.agreed_hours_requester,
          agreed_hours_provider: data.agreed_hours_provider,
          status: "proposed",
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to propose exchange:", error);
        return null;
      }

      return exchange;
    } catch (error) {
      console.error("Error proposing exchange:", error);
      return null;
    }
  }

  /**
   * Accept an exchange proposal
   */
  async acceptExchange(
    exchangeId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc(
        "accept_skill_exchange" as any,
        {
          p_exchange_id: exchangeId,
          p_user_id: userId,
        },
      );

      if (error) {
        console.error("Failed to accept exchange:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error accepting exchange:", error);
      return false;
    }
  }

  /**
   * Start an exchange
   */
  async startExchange(exchangeId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc(
        "start_skill_exchange" as any,
        {
          p_exchange_id: exchangeId,
          p_user_id: userId,
        },
      );

      if (error) {
        console.error("Failed to start exchange:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error starting exchange:", error);
      return false;
    }
  }

  /**
   * Complete an exchange (requires both parties to confirm)
   */
  async completeExchange(
    exchangeId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc(
        "complete_skill_exchange" as any,
        {
          p_exchange_id: exchangeId,
          p_user_id: userId,
        },
      );

      if (error) {
        console.error("Failed to complete exchange:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error completing exchange:", error);
      return false;
    }
  }

  /**
   * Cancel an exchange
   */
  async cancelExchange(exchangeId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (this.supabase.from as any)("skill_exchanges")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", exchangeId)
        .or(`requester_id.eq.${userId},provider_id.eq.${userId}`);

      if (error) {
        console.error("Failed to cancel exchange:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error cancelling exchange:", error);
      return false;
    }
  }

  /**
   * Get exchange by ID
   */
  async getExchange(exchangeId: string): Promise<SkillExchange | null> {
    try {
      const { data, error } = await (this.supabase.from as any)(
        "skill_exchanges",
      )
        .select("*")
        .eq("id", exchangeId)
        .single();

      if (error) {
        console.error("Failed to get exchange:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting exchange:", error);
      return null;
    }
  }

  /**
   * Get user's exchanges
   */
  async getUserExchanges(userId: string): Promise<SkillExchange[]> {
    try {
      const { data, error } = await (this.supabase.from as any)(
        "skill_exchanges",
      )
        .select("*")
        .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to get user exchanges:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error getting user exchanges:", error);
      return [];
    }
  }

  /**
   * Update exchange hours
   */
  async updateExchangeHours(
    exchangeId: string,
    userId: string,
    hours: number,
  ): Promise<boolean> {
    try {
      // Get exchange to determine if user is requester or provider
      const exchange = await this.getExchange(exchangeId);
      if (!exchange) return false;

      const isRequester = exchange.requester_id === userId;
      const isProvider = exchange.provider_id === userId;

      if (!isRequester && !isProvider) return false;

      const updateField = isRequester
        ? "completed_hours_requester"
        : "completed_hours_provider";

      const { error } = await (this.supabase.from as any)("skill_exchanges")
        .update({
          [updateField]: hours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exchangeId);

      if (error) {
        console.error("Failed to update exchange hours:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating exchange hours:", error);
      return false;
    }
  }

  /**
   * Submit review for exchange
   */
  async submitReview(
    exchangeId: string,
    userId: string,
    rating: number,
    review: string,
  ): Promise<boolean> {
    try {
      // Get exchange to determine if user is requester or provider
      const exchange = await this.getExchange(exchangeId);
      if (!exchange) return false;

      const isRequester = exchange.requester_id === userId;
      const isProvider = exchange.provider_id === userId;

      if (!isRequester && !isProvider) return false;

      const ratingField = isRequester
        ? "requester_rating"
        : "provider_rating";
      const reviewField = isRequester
        ? "requester_review"
        : "provider_review";

      const { error } = await (this.supabase.from as any)("skill_exchanges")
        .update({
          [ratingField]: rating,
          [reviewField]: review,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exchangeId);

      if (error) {
        console.error("Failed to submit review:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error submitting review:", error);
      return false;
    }
  }

  /**
   * Get matching skill offers for a user
   */
  async getMatchingOffers(
    userId: string,
    desiredSkills: string[],
  ): Promise<SkillOffer[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_matching_skill_offers" as any,
        {
          p_user_id: userId,
          p_desired_skills: desiredSkills,
        },
      );

      if (error) {
        console.error("Failed to get matching offers:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error getting matching offers:", error);
      return [];
    }
  }

  /**
   * Increment views count for a skill offer
   */
  async incrementViews(offerId: string): Promise<void> {
    try {
      await (this.supabase.from as any)("skill_offers")
        .update({
          views_count: (this.supabase as any).raw("views_count + 1"),
        })
        .eq("id", offerId);
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  }
}

export const skillSwapService = new SkillSwapService();
