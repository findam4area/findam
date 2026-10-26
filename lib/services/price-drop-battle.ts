// Price Drop Battle Service
// Task 69: Implement Price Drop Battle feature

import { createClient } from "@/lib/supabase/client";

export interface PriceDropBattle {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  original_price: number;
  current_offer: number;
  final_price: number | null;
  status: "active" | "accepted" | "rejected" | "expired" | "cancelled";
  current_round: number;
  max_rounds: number;
  last_offer_by: "buyer" | "seller" | null;
  round_duration_minutes: number;
  round_started_at: string | null;
  round_expires_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BattleOffer {
  id: string;
  battle_id: string;
  round_number: number;
  offered_by: "buyer" | "seller";
  offer_amount: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
  responded_at: string | null;
}

export interface BattleHistory {
  battle_id: string;
  listing_id: string;
  listing_title: string;
  other_user_id: string;
  role: "buyer" | "seller";
  original_price: number;
  final_price: number | null;
  status: string;
  rounds: number;
  created_at: string;
  completed_at: string | null;
}

export class PriceDropBattleService {
  private supabase = createClient();

  // Start a new price drop battle
  async startBattle(listingId: string, initialOffer: number): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase.rpc as any)(
      "start_price_drop_battle",
      {
        p_listing_id: listingId,
        p_buyer_id: user.id,
        p_initial_offer: initialOffer,
      },
    );

    if (error) throw error;
    return data;
  }

  // Make a counter offer
  async makeCounterOffer(
    battleId: string,
    offerAmount: number,
    message?: string,
  ): Promise<BattleOffer> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase.rpc as any)(
      "make_counter_offer",
      {
        p_battle_id: battleId,
        p_user_id: user.id,
        p_offer_amount: offerAmount,
        p_message: message || null,
      },
    );

    if (error) throw error;
    return data;
  }

  // Accept current offer
  async acceptOffer(battleId: string): Promise<PriceDropBattle> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase.rpc as any)(
      "accept_battle_offer",
      {
        p_battle_id: battleId,
        p_user_id: user.id,
      },
    );

    if (error) throw error;
    return data;
  }

  // Reject/cancel battle
  async rejectBattle(battleId: string): Promise<PriceDropBattle> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase.rpc as any)("reject_battle", {
      p_battle_id: battleId,
      p_user_id: user.id,
    });

    if (error) throw error;
    return data;
  }

  // Get battle by ID
  async getBattleById(battleId: string): Promise<PriceDropBattle | null> {
    const { data, error } = await (this.supabase as any)
      .from("price_drop_battles")
      .select("*")
      .eq("id", battleId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as PriceDropBattle;
  }

  // Get all offers for a battle
  async getBattleOffers(battleId: string): Promise<BattleOffer[]> {
    const { data, error } = await (this.supabase as any)
      .from("battle_offers")
      .select("*")
      .eq("battle_id", battleId)
      .order("round_number", { ascending: true });

    if (error) throw error;
    return (data || []) as BattleOffer[];
  }

  // Get active battles for current user
  async getActiveBattles(): Promise<PriceDropBattle[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase as any)
      .from("price_drop_battles")
      .select("*")
      .eq("status", "active")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as PriceDropBattle[];
  }

  // Get battle history for current user
  async getBattleHistory(limit: number = 20): Promise<BattleHistory[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase.rpc as any)(
      "get_user_battle_history",
      {
        p_user_id: user.id,
        p_limit: limit,
      },
    );

    if (error) throw error;
    return data || [];
  }

  // Get battles for a specific listing
  async getListingBattles(listingId: string): Promise<PriceDropBattle[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await (this.supabase as any)
      .from("price_drop_battles")
      .select("*")
      .eq("listing_id", listingId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as PriceDropBattle[];
  }

  // Check if user has active battle for listing
  async hasActiveBattle(listingId: string): Promise<boolean> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await (this.supabase as any)
      .from("price_drop_battles")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  // Calculate time remaining in current round
  getTimeRemaining(battle: PriceDropBattle): number {
    if (!battle.round_expires_at) return 0;
    const expiresAt = new Date(battle.round_expires_at).getTime();
    const now = Date.now();
    return Math.max(0, expiresAt - now);
  }

  // Check if it's user's turn
  isUserTurn(battle: PriceDropBattle, userId: string): boolean {
    if (battle.status !== "active") return false;
    if (!battle.last_offer_by) return false;

    // If buyer made last offer, it's seller's turn
    if (battle.last_offer_by === "buyer") {
      return userId === battle.seller_id;
    }
    // If seller made last offer, it's buyer's turn
    return userId === battle.buyer_id;
  }

  // Get user's role in battle
  getUserRole(
    battle: PriceDropBattle,
    userId: string,
  ): "buyer" | "seller" | null {
    if (battle.buyer_id === userId) return "buyer";
    if (battle.seller_id === userId) return "seller";
    return null;
  }

  // Calculate savings for buyer
  calculateSavings(battle: PriceDropBattle): number {
    const finalPrice = battle.final_price || battle.current_offer;
    return battle.original_price - finalPrice;
  }

  // Calculate savings percentage
  calculateSavingsPercentage(battle: PriceDropBattle): number {
    const savings = this.calculateSavings(battle);
    return (savings / battle.original_price) * 100;
  }
}
