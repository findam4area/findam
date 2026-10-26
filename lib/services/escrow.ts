/**
 * Escrow Service
 * Handles escrow payment flow including initialization, confirmation, auto-release, and disputes
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.9, 4.10
 */

import { createClient } from "@/lib/supabase/server";
import { paystackClient } from "@/lib/paystack/client";
import type {
  EscrowTransaction,
  CreateEscrowRequest,
  ConfirmDeliveryRequest,
  DisputeEscrowRequest,
} from "@/lib/types";

export class EscrowService {
  /**
   * Initialize escrow transaction with Paystack integration
   * Requirements: 4.1, 4.9
   */
  async initializeEscrow(params: {
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    buyer_email: string;
    estimated_delivery_date?: string;
    callback_url?: string;
  }): Promise<{
    escrow_transaction: EscrowTransaction;
    payment_url: string;
    reference: string;
  }> {
    const supabase = await createClient();

    // Validate amount
    if (params.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Validate buyer and seller are different
    if (params.buyer_id === params.seller_id) {
      throw new Error("Buyer and seller must be different users");
    }

    // Calculate escrow fee (2.5%)
    const { data: feeData, error: feeError } = await (supabase as any).rpc(
      "calculate_escrow_fee",
      { amount: params.amount },
    );

    if (feeError) {
      throw new Error(`Failed to calculate fee: ${feeError.message}`);
    }

    const fee = feeData as number;

    // Generate unique reference for Paystack
    const reference = `escrow_${Date.now()}_${params.buyer_id.substring(0, 8)}`;

    // Calculate auto-release date (7 days after estimated delivery)
    let auto_release_at: string | null = null;
    if (params.estimated_delivery_date) {
      const estimatedDate = new Date(params.estimated_delivery_date);
      const autoReleaseDate = new Date(estimatedDate);
      autoReleaseDate.setDate(autoReleaseDate.getDate() + 7);
      auto_release_at = autoReleaseDate.toISOString();
    }

    // Create escrow transaction record
    const { data: escrowTransaction, error: escrowError } = await (
      supabase as any
    )
      .from("escrow_transactions")
      .insert({
        listing_id: params.listing_id,
        buyer_id: params.buyer_id,
        seller_id: params.seller_id,
        amount: params.amount,
        fee,
        status: "pending",
        paystack_reference: reference,
        estimated_delivery_date: params.estimated_delivery_date || null,
        auto_release_at,
      })
      .select()
      .single();

    if (escrowError) {
      throw new Error(
        `Failed to create escrow transaction: ${escrowError.message}`,
      );
    }

    // Initialize Paystack payment
    // Amount in kobo (₦1 = 100 kobo)
    const amountInKobo = Math.round(params.amount * 100);

    try {
      const paystackResponse = await paystackClient.initializeTransaction({
        email: params.buyer_email,
        amount: amountInKobo,
        reference,
        callback_url: params.callback_url,
        metadata: {
          escrow_transaction_id: escrowTransaction.id,
          listing_id: params.listing_id,
          buyer_id: params.buyer_id,
          seller_id: params.seller_id,
        },
      });

      return {
        escrow_transaction: escrowTransaction as EscrowTransaction,
        payment_url: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
      };
    } catch (error) {
      // Rollback: Delete escrow transaction if Paystack initialization fails
      await (supabase as any)
        .from("escrow_transactions")
        .delete()
        .eq("id", escrowTransaction.id);

      throw new Error(
        `Failed to initialize payment: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Confirm payment and update escrow status to 'held'
   * Called after successful Paystack payment verification
   * Requirements: 4.1, 4.2, 4.10
   */
  async confirmPayment(params: {
    reference: string;
  }): Promise<EscrowTransaction> {
    const supabase = await createClient();

    // Verify payment with Paystack
    const paystackResponse = await paystackClient.verifyTransaction(
      params.reference,
    );

    if (paystackResponse.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    // Update escrow transaction status to 'held'
    const { data: escrowTransaction, error } = await (supabase as any)
      .from("escrow_transactions")
      .update({ status: "held" })
      .eq("paystack_reference", params.reference)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update escrow status: ${error.message}`);
    }

    // TODO: Send notification to seller that payment is secured (Requirement 4.2, 4.10)
    // This will be implemented when notification system is available

    return escrowTransaction as EscrowTransaction;
  }

  /**
   * Confirm delivery and release funds to seller wallet
   * Requirements: 4.3, 4.10
   */
  async confirmDelivery(params: {
    escrow_transaction_id: string;
    buyer_id: string;
    rating?: number;
    review?: string;
  }): Promise<{ escrow_transaction: EscrowTransaction; released: boolean }> {
    const supabase = await createClient();

    // Get escrow transaction
    const { data: escrowTransaction, error: fetchError } = await (
      supabase as any
    )
      .from("escrow_transactions")
      .select("*")
      .eq("id", params.escrow_transaction_id)
      .single();

    if (fetchError) {
      throw new Error(`Escrow transaction not found: ${fetchError.message}`);
    }

    // Validate buyer
    if (escrowTransaction.buyer_id !== params.buyer_id) {
      throw new Error("Only the buyer can confirm delivery");
    }

    // Validate status
    if (escrowTransaction.status !== "held") {
      throw new Error(
        `Cannot confirm delivery for transaction with status: ${escrowTransaction.status}`,
      );
    }

    // Update escrow status to 'released'
    const { data: updatedEscrow, error: updateError } = await (supabase as any)
      .from("escrow_transactions")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
      })
      .eq("id", params.escrow_transaction_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to release escrow: ${updateError.message}`);
    }

    // Release funds to seller wallet (within 24 hours - simulated immediately for now)
    // This will credit the seller's wallet
    await this.releaseFundsToWallet({
      escrow_transaction_id: params.escrow_transaction_id,
      seller_id: escrowTransaction.seller_id,
      amount: escrowTransaction.amount,
      fee: escrowTransaction.fee,
    });

    // TODO: Send notifications to both parties (Requirement 4.10)
    // This will be implemented when notification system is available

    return {
      escrow_transaction: updatedEscrow as EscrowTransaction,
      released: true,
    };
  }

  /**
   * Release funds to seller wallet
   * Internal method called by confirmDelivery and auto-release
   * Requirements: 4.3
   */
  private async releaseFundsToWallet(params: {
    escrow_transaction_id: string;
    seller_id: string;
    amount: number;
    fee: number;
  }): Promise<void> {
    const supabase = await createClient();

    // Calculate net amount (amount - fee)
    const netAmount = params.amount - params.fee;

    // Get or create seller wallet
    let { data: wallet, error: walletError } = await (supabase as any)
      .from("wallets")
      .select("*")
      .eq("user_id", params.seller_id)
      .single();

    if (walletError && walletError.code !== "PGRST116") {
      throw new Error(`Failed to fetch wallet: ${walletError.message}`);
    }

    // If wallet doesn't exist, create it
    if (!wallet) {
      const { data: newWallet, error: createError } = await (supabase as any)
        .from("wallets")
        .insert({ user_id: params.seller_id })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create wallet: ${createError.message}`);
      }

      wallet = newWallet;
    }

    // Update wallet balance
    const newAvailableBalance = wallet.available_balance + netAmount;
    const newTotalEarned = wallet.total_earned + netAmount;

    const { error: updateWalletError } = await (supabase as any)
      .from("wallets")
      .update({
        available_balance: newAvailableBalance,
        total_earned: newTotalEarned,
      })
      .eq("id", wallet.id);

    if (updateWalletError) {
      throw new Error(`Failed to update wallet: ${updateWalletError.message}`);
    }

    // Create wallet transaction record
    const { error: txnError } = await (supabase as any)
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        user_id: params.seller_id,
        type: "credit",
        amount: netAmount,
        fee: params.fee,
        balance_after: newAvailableBalance,
        description: "Escrow release",
        category: "escrow_release",
        status: "completed",
        reference: params.escrow_transaction_id,
      });

    if (txnError) {
      throw new Error(
        `Failed to create wallet transaction: ${txnError.message}`,
      );
    }
  }

  /**
   * Auto-release funds after 7 days if buyer doesn't confirm
   * Called by cron job
   * Requirements: 4.4
   */
  async autoReleaseFunds(): Promise<{
    released_count: number;
    transactions: EscrowTransaction[];
  }> {
    const supabase = await createClient();

    // Find all escrow transactions that are past auto-release date
    const { data: transactions, error: fetchError } = await (supabase as any)
      .from("escrow_transactions")
      .select("*")
      .eq("status", "held")
      .not("auto_release_at", "is", null)
      .lte("auto_release_at", new Date().toISOString());

    if (fetchError) {
      throw new Error(
        `Failed to fetch transactions for auto-release: ${fetchError.message}`,
      );
    }

    if (!transactions || transactions.length === 0) {
      return { released_count: 0, transactions: [] };
    }

    const releasedTransactions: EscrowTransaction[] = [];

    // Process each transaction
    for (const transaction of transactions) {
      try {
        // Update status to released
        const { data: updatedEscrow, error: updateError } = await (
          supabase as any
        )
          .from("escrow_transactions")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)
          .select()
          .single();

        if (updateError) {
          console.error(
            `Failed to auto-release transaction ${transaction.id}:`,
            updateError,
          );
          continue;
        }

        // Release funds to wallet
        await this.releaseFundsToWallet({
          escrow_transaction_id: transaction.id,
          seller_id: transaction.seller_id,
          amount: transaction.amount,
          fee: transaction.fee,
        });

        releasedTransactions.push(updatedEscrow as EscrowTransaction);

        // TODO: Send notifications to both parties (Requirement 4.10)
      } catch (error) {
        console.error(
          `Error auto-releasing transaction ${transaction.id}:`,
          error,
        );
      }
    }

    return {
      released_count: releasedTransactions.length,
      transactions: releasedTransactions,
    };
  }

  /**
   * Dispute transaction and freeze funds
   * Requirements: 4.5
   */
  async disputeTransaction(params: {
    escrow_transaction_id: string;
    buyer_id: string;
    reason: string;
    evidence?: Record<string, any>;
  }): Promise<EscrowTransaction> {
    const supabase = await createClient();

    // Get escrow transaction
    const { data: escrowTransaction, error: fetchError } = await (
      supabase as any
    )
      .from("escrow_transactions")
      .select("*")
      .eq("id", params.escrow_transaction_id)
      .single();

    if (fetchError) {
      throw new Error(`Escrow transaction not found: ${fetchError.message}`);
    }

    // Validate buyer
    if (escrowTransaction.buyer_id !== params.buyer_id) {
      throw new Error("Only the buyer can dispute this transaction");
    }

    // Validate status
    if (escrowTransaction.status !== "held") {
      throw new Error(
        `Cannot dispute transaction with status: ${escrowTransaction.status}`,
      );
    }

    // Update status to 'disputed'
    const { data: updatedEscrow, error: updateError } = await (supabase as any)
      .from("escrow_transactions")
      .update({
        status: "disputed",
        dispute_reason: params.reason,
        dispute_evidence: params.evidence || null,
      })
      .eq("id", params.escrow_transaction_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to dispute transaction: ${updateError.message}`);
    }

    // TODO: Send notifications to both parties and admin (Requirement 4.10)
    // This will be implemented when notification system is available

    return updatedEscrow as EscrowTransaction;
  }

  /**
   * Get escrow transaction by ID
   */
  async getTransaction(
    escrow_transaction_id: string,
  ): Promise<EscrowTransaction | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("escrow_transactions")
      .select("*")
      .eq("id", escrow_transaction_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    return data as EscrowTransaction;
  }

  /**
   * Check if escrow should be auto-released
   * Used by tests and cron jobs
   */
  async checkAutoRelease(escrow_transaction_id: string): Promise<{
    autoReleased: boolean;
    status: string;
  }> {
    const supabase = await createClient();

    const { data: transaction, error } = await (supabase as any)
      .from("escrow_transactions")
      .select("*")
      .eq("id", escrow_transaction_id)
      .single();

    if (error) {
      throw new Error(`Transaction not found: ${error.message}`);
    }

    // Check if disputed
    if (transaction.status === "disputed") {
      return { autoReleased: false, status: "disputed" };
    }

    // Check if already released
    if (transaction.status === "released") {
      return { autoReleased: false, status: "released" };
    }

    // Check if past auto-release date
    if (transaction.auto_release_at) {
      const autoReleaseDate = new Date(transaction.auto_release_at);
      const now = new Date();

      if (now >= autoReleaseDate && transaction.status === "held") {
        return { autoReleased: true, status: "released" };
      }
    }

    return { autoReleased: false, status: transaction.status };
  }

  /**
   * Get escrow details with authorization check
   */
  async getEscrowDetails(
    escrow_transaction_id: string,
    user_id: string,
  ): Promise<EscrowTransaction> {
    const supabase = await createClient();

    const { data: transaction, error } = await (supabase as any)
      .from("escrow_transactions")
      .select("*")
      .eq("id", escrow_transaction_id)
      .single();

    if (error) {
      throw new Error(`Transaction not found: ${error.message}`);
    }

    // Check authorization
    if (transaction.buyer_id !== user_id && transaction.seller_id !== user_id) {
      throw new Error("Unauthorized");
    }

    return transaction as EscrowTransaction;
  }

  /**
   * Get escrow transactions for a user (as buyer or seller)
   */
  async getUserTransactions(params: {
    user_id: string;
    role?: "buyer" | "seller";
    status?: EscrowTransaction["status"];
    limit?: number;
    offset?: number;
  }): Promise<EscrowTransaction[]> {
    const supabase = await createClient();

    let query = (supabase as any).from("escrow_transactions").select("*");

    // Filter by role
    if (params.role === "buyer") {
      query = query.eq("buyer_id", params.user_id);
    } else if (params.role === "seller") {
      query = query.eq("seller_id", params.user_id);
    } else {
      // Both buyer and seller
      query = query.or(
        `buyer_id.eq.${params.user_id},seller_id.eq.${params.user_id}`,
      );
    }

    // Filter by status
    if (params.status) {
      query = query.eq("status", params.status);
    }

    // Pagination
    query = query
      .order("created_at", { ascending: false })
      .limit(params.limit || 50)
      .range(
        params.offset || 0,
        (params.offset || 0) + (params.limit || 50) - 1,
      );

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return (data as EscrowTransaction[]) || [];
  }
}

// Export singleton instance
export const escrowService = new EscrowService();
