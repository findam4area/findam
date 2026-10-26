/**
 * Barter Service
 *
 * Handles barter and exchange proposals between users.
 * Implements proposal creation, acceptance, rejection, and counter-proposals.
 *
 * Requirements: 12.3, 12.4, 12.5, 12.6
 */

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type BarterProposal = Database["public"]["Tables"]["barter_proposals"]["Row"];
type BarterProposalInsert =
  Database["public"]["Tables"]["barter_proposals"]["Insert"];

export interface CreateProposalParams {
  targetListingId: string;
  offeredListingId: string;
  proposerId: string;
  message?: string;
  cashAdjustment?: number;
}

export interface ProposalResponse {
  success: boolean;
  proposalId?: string;
  error?: string;
}

export class BarterService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Create a new barter proposal
   * Requirements: 12.3, 12.4
   */
  async createProposal(
    params: CreateProposalParams,
  ): Promise<ProposalResponse> {
    try {
      const {
        targetListingId,
        offeredListingId,
        proposerId,
        message,
        cashAdjustment = 0,
      } = params;

      // Validate that both listings exist and are active
      const { data: targetListing, error: targetError } = await (
        this.supabase as any
      )
        .from("listings")
        .select("id, user_id, price, title")
        .eq("id", targetListingId)
        .eq("status", "active")
        .single();

      if (targetError || !targetListing) {
        return {
          success: false,
          error: "Target listing not found or not available",
        };
      }

      const { data: offeredListing, error: offeredError } = await (
        this.supabase as any
      )
        .from("listings")
        .select("id, user_id, price, title")
        .eq("id", offeredListingId)
        .eq("status", "active")
        .single();

      if (offeredError || !offeredListing) {
        return {
          success: false,
          error: "Offered listing not found or not available",
        };
      }

      // Validate that proposer owns the offered listing
      if (offeredListing.user_id !== proposerId) {
        return {
          success: false,
          error: "You can only propose exchanges with your own listings",
        };
      }

      // Prevent self-exchange
      if (targetListing.user_id === proposerId) {
        return {
          success: false,
          error: "You cannot propose an exchange with your own listing",
        };
      }

      // Calculate value difference
      const valueDifference =
        (targetListing.price || 0) - (offeredListing.price || 0);

      // Create the proposal
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const proposalData: BarterProposalInsert = {
        target_listing_id: targetListingId,
        offered_listing_id: offeredListingId,
        proposer_id: proposerId,
        receiver_id: targetListing.user_id,
        message: message || null,
        value_difference: valueDifference,
        cash_adjustment: cashAdjustment,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        offered_listing_value: offeredListing.price || 0,
        target_listing_value: targetListing.price || 0,
      };

      const { data: proposal, error: proposalError } = await this.supabase
        .from("barter_proposals")
        .insert(proposalData)
        .select()
        .single();

      if (proposalError || !proposal) {
        return {
          success: false,
          error: "Failed to create proposal",
        };
      }

      // Create notification for the receiver (Requirement 12.4)
      await this.createProposalNotification(
        proposal.id,
        targetListing.user_id,
        proposerId,
        offeredListing.title,
        targetListing.title,
      );

      return {
        success: true,
        proposalId: proposal.id,
      };
    } catch (error) {
      console.error("Error creating barter proposal:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Accept a barter proposal
   * Requirements: 12.5, 12.6
   */
  async acceptProposal(
    proposalId: string,
    userId: string,
  ): Promise<ProposalResponse> {
    try {
      // Verify user is the receiver
      const { data: proposal, error: fetchError } = await (this.supabase as any)
        .from("barter_proposals")
        .select(
          "*, target_listing:listings!target_listing_id(*), offered_listing:listings!offered_listing_id(*)",
        )
        .eq("id", proposalId)
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .single();

      if (fetchError || !proposal) {
        return {
          success: false,
          error: "Proposal not found or you are not authorized to accept it",
        };
      }

      // Update proposal status to accepted
      const { error: updateError } = await this.supabase
        .from("barter_proposals")
        .update({ status: "accepted" })
        .eq("id", proposalId);

      if (updateError) {
        return {
          success: false,
          error: "Failed to accept proposal",
        };
      }

      // Create exchange transaction record (Requirement 12.6)
      await this.createExchangeTransaction(proposal);

      // Notify the proposer
      await this.createAcceptanceNotification(
        proposalId,
        proposal.proposer_id,
        userId,
      );

      return {
        success: true,
        proposalId,
      };
    } catch (error) {
      console.error("Error accepting barter proposal:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Reject a barter proposal
   * Requirements: 12.5
   */
  async rejectProposal(
    proposalId: string,
    userId: string,
  ): Promise<ProposalResponse> {
    try {
      // Verify user is the receiver
      const { data: proposal, error: fetchError } = await this.supabase
        .from("barter_proposals")
        .select("proposer_id, receiver_id")
        .eq("id", proposalId)
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .single();

      if (fetchError || !proposal) {
        return {
          success: false,
          error: "Proposal not found or you are not authorized to reject it",
        };
      }

      // Update proposal status to rejected
      const { error: updateError } = await this.supabase
        .from("barter_proposals")
        .update({ status: "rejected" })
        .eq("id", proposalId);

      if (updateError) {
        return {
          success: false,
          error: "Failed to reject proposal",
        };
      }

      // Notify the proposer
      await this.createRejectionNotification(
        proposalId,
        proposal.proposer_id,
        userId,
      );

      return {
        success: true,
        proposalId,
      };
    } catch (error) {
      console.error("Error rejecting barter proposal:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Create a counter-proposal
   * Requirements: 12.5
   */
  async counterProposal(
    originalProposalId: string,
    userId: string,
    newCashAdjustment: number,
    message?: string,
  ): Promise<ProposalResponse> {
    try {
      // Get the original proposal
      const { data: originalProposal, error: fetchError } = await this.supabase
        .from("barter_proposals")
        .select("*")
        .eq("id", originalProposalId)
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .single();

      if (fetchError || !originalProposal) {
        return {
          success: false,
          error: "Original proposal not found or you are not authorized",
        };
      }

      // Update original proposal status to countered
      const { error: updateError } = await this.supabase
        .from("barter_proposals")
        .update({ status: "countered" })
        .eq("id", originalProposalId);

      if (updateError) {
        return {
          success: false,
          error: "Failed to update original proposal",
        };
      }

      // Create new counter-proposal (swap proposer and receiver)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const counterProposalData: BarterProposalInsert = {
        target_listing_id: originalProposal.offered_listing_id,
        offered_listing_id: originalProposal.target_listing_id,
        proposer_id: userId,
        receiver_id: originalProposal.proposer_id,
        message: message || null,
        value_difference: -(originalProposal.value_difference ?? 0),
        cash_adjustment: newCashAdjustment,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        counter_proposal_id: originalProposalId,
        offered_listing_value: originalProposal.target_listing_value ?? 0,
        target_listing_value: originalProposal.offered_listing_value ?? 0,
      };

      const { data: counterProposal, error: counterError } = await this.supabase
        .from("barter_proposals")
        .insert(counterProposalData)
        .select()
        .single();

      if (counterError || !counterProposal) {
        return {
          success: false,
          error: "Failed to create counter-proposal",
        };
      }

      // Notify the original proposer
      await this.createCounterProposalNotification(
        counterProposal.id,
        originalProposal.proposer_id,
        userId,
      );

      return {
        success: true,
        proposalId: counterProposal.id,
      };
    } catch (error) {
      console.error("Error creating counter-proposal:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Get proposals for a user (received or sent)
   */
  async getUserProposals(
    userId: string,
    type: "received" | "sent" = "received",
  ) {
    try {
      const column = type === "received" ? "receiver_id" : "proposer_id";

      const { data, error } = await (this.supabase as any)
        .from("barter_proposals")
        .select(
          `
          *,
          target_listing:listings!target_listing_id(id, title, price, images, user_id),
          offered_listing:listings!offered_listing_id(id, title, price, images, user_id),
          proposer:users!proposer_id(id, username, avatar_url),
          receiver:users!receiver_id(id, username, avatar_url)
        `,
        )
        .eq(column, userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, proposals: data };
    } catch (error) {
      console.error("Error fetching user proposals:", error);
      return { success: false, error: "Failed to fetch proposals" };
    }
  }

  /**
   * Create notification for new proposal (Requirement 12.4)
   */
  private async createProposalNotification(
    proposalId: string,
    receiverId: string,
    proposerId: string,
    offeredItemTitle: string,
    targetItemTitle: string,
  ) {
    try {
      await this.supabase.from("notifications").insert({
        user_id: receiverId,
        type: "barter_proposal",
        title: "New Exchange Proposal",
        message: `Someone wants to exchange "${offeredItemTitle}" for your "${targetItemTitle}"`,
        data: {
          proposal_id: proposalId,
          proposer_id: proposerId,
        },
      });
    } catch (error) {
      console.error("Error creating proposal notification:", error);
    }
  }

  /**
   * Create notification for accepted proposal
   */
  private async createAcceptanceNotification(
    proposalId: string,
    proposerId: string,
    receiverId: string,
  ) {
    try {
      await this.supabase.from("notifications").insert({
        user_id: proposerId,
        type: "barter_accepted",
        title: "Exchange Proposal Accepted",
        message: "Your exchange proposal has been accepted!",
        data: {
          proposal_id: proposalId,
          receiver_id: receiverId,
        },
      });
    } catch (error) {
      console.error("Error creating acceptance notification:", error);
    }
  }

  /**
   * Create notification for rejected proposal
   */
  private async createRejectionNotification(
    proposalId: string,
    proposerId: string,
    receiverId: string,
  ) {
    try {
      await this.supabase.from("notifications").insert({
        user_id: proposerId,
        type: "barter_rejected",
        title: "Exchange Proposal Declined",
        message: "Your exchange proposal was declined",
        data: {
          proposal_id: proposalId,
          receiver_id: receiverId,
        },
      });
    } catch (error) {
      console.error("Error creating rejection notification:", error);
    }
  }

  /**
   * Create notification for counter-proposal
   */
  private async createCounterProposalNotification(
    counterProposalId: string,
    originalProposerId: string,
    counterProposerId: string,
  ) {
    try {
      await this.supabase.from("notifications").insert({
        user_id: originalProposerId,
        type: "barter_counter",
        title: "Counter-Proposal Received",
        message: "You received a counter-proposal for your exchange",
        data: {
          proposal_id: counterProposalId,
          counter_proposer_id: counterProposerId,
        },
      });
    } catch (error) {
      console.error("Error creating counter-proposal notification:", error);
    }
  }

  /**
   * Create exchange transaction record (Requirement 12.6)
   */
  private async createExchangeTransaction(proposal: any) {
    try {
      // This would create a transaction record in a barter_transactions table
      // For now, we'll just log it as the table structure isn't fully defined
      console.log("Creating exchange transaction for proposal:", proposal.id);

      // In a full implementation, this would:
      // 1. Create a transaction record
      // 2. Update both listings status
      // 3. Create escrow if cash adjustment is involved
      // 4. Set up delivery coordination
    } catch (error) {
      console.error("Error creating exchange transaction:", error);
    }
  }
}

export const barterService = new BarterService();
