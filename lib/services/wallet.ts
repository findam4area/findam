/**
 * Wallet Service
 * Handles wallet operations including balance management, credits, debits, and withdrawals
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.10
 */

import { createClient } from "@/lib/supabase/server";
import { paystackClient } from "@/lib/paystack/client";
import type { Wallet, WalletTransaction, Withdrawal } from "@/lib/types";

export class WalletService {
  /**
   * Get wallet balance for a user
   * Requirements: 5.1
   */
  async getBalance(userId: string): Promise<Wallet> {
    const supabase = await createClient();

    // Get or create wallet
    let { data: wallet, error: walletError } = await (supabase as any)
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError && walletError.code !== "PGRST116") {
      throw new Error(`Failed to fetch wallet: ${walletError.message}`);
    }

    // If wallet doesn't exist, create it
    if (!wallet) {
      const { data: newWallet, error: createError } = await (supabase as any)
        .from("wallets")
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create wallet: ${createError.message}`);
      }

      wallet = newWallet;
    }

    return wallet as Wallet;
  }

  /**
   * Credit wallet with funds
   * Requirements: 5.2, 5.7, 5.8
   */
  async creditWallet(params: {
    user_id: string;
    amount: number;
    description: string;
    category: "escrow_release" | "refund" | "adjustment" | "referral" | "bonus";
    reference?: string;
    metadata?: Record<string, any>;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const supabase = await createClient();

    // Validate amount
    if (params.amount <= 0) {
      throw new Error("Credit amount must be greater than 0");
    }

    // Get wallet
    const wallet = await this.getBalance(params.user_id);

    // Calculate new balance
    const newAvailableBalance = wallet.available_balance + params.amount;
    const newTotalEarned = wallet.total_earned + params.amount;

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await (supabase as any)
      .from("wallets")
      .update({
        available_balance: newAvailableBalance,
        total_earned: newTotalEarned,
      })
      .eq("id", wallet.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update wallet: ${updateError.message}`);
    }

    // Create transaction record
    const { data: transaction, error: txnError } = await (supabase as any)
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        user_id: params.user_id,
        type: "credit",
        amount: params.amount,
        fee: 0,
        balance_after: newAvailableBalance,
        description: params.description,
        category: params.category,
        status: "completed",
        reference: params.reference || null,
        metadata: params.metadata || null,
      })
      .select()
      .single();

    if (txnError) {
      throw new Error(
        `Failed to create wallet transaction: ${txnError.message}`,
      );
    }

    // TODO: Send notification for wallet credit (Requirement 5.9)
    // This will be implemented when notification system is available

    return {
      wallet: updatedWallet as Wallet,
      transaction: transaction as WalletTransaction,
    };
  }

  /**
   * Debit wallet (for purchases, fees, etc.)
   * Requirements: 5.7, 5.8
   */
  async debitWallet(params: {
    user_id: string;
    amount: number;
    fee?: number;
    description: string;
    category: "purchase" | "withdrawal" | "fee" | "adjustment";
    reference?: string;
    metadata?: Record<string, any>;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const supabase = await createClient();

    // Validate amount
    if (params.amount <= 0) {
      throw new Error("Debit amount must be greater than 0");
    }

    const fee = params.fee || 0;
    const totalDebit = params.amount + fee;

    // Get wallet
    const wallet = await this.getBalance(params.user_id);

    // Check sufficient balance
    if (wallet.available_balance < totalDebit) {
      throw new Error("Insufficient wallet balance");
    }

    // Calculate new balance
    const newAvailableBalance = wallet.available_balance - totalDebit;

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await (supabase as any)
      .from("wallets")
      .update({
        available_balance: newAvailableBalance,
      })
      .eq("id", wallet.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update wallet: ${updateError.message}`);
    }

    // Create transaction record
    const { data: transaction, error: txnError } = await (supabase as any)
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        user_id: params.user_id,
        type: "debit",
        amount: params.amount,
        fee: fee,
        balance_after: newAvailableBalance,
        description: params.description,
        category: params.category,
        status: "completed",
        reference: params.reference || null,
        metadata: params.metadata || null,
      })
      .select()
      .single();

    if (txnError) {
      throw new Error(
        `Failed to create wallet transaction: ${txnError.message}`,
      );
    }

    // TODO: Send notification for wallet debit (Requirement 5.9)
    // This will be implemented when notification system is available

    return {
      wallet: updatedWallet as Wallet,
      transaction: transaction as WalletTransaction,
    };
  }

  /**
   * Get wallet transaction history
   * Requirements: 5.7
   */
  async getTransactions(params: {
    user_id: string;
    category?:
      | "escrow_release"
      | "withdrawal"
      | "refund"
      | "purchase"
      | "fee"
      | "adjustment";
    limit?: number;
    offset?: number;
  }): Promise<WalletTransaction[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", params.user_id);

    // Filter by category if provided
    if (params.category) {
      query = query.eq("category", params.category);
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

    return (data as WalletTransaction[]) || [];
  }

  /**
   * Request withdrawal to bank account
   * Requirements: 5.3, 5.4, 5.5, 5.6, 5.10
   */
  async requestWithdrawal(params: {
    user_id: string;
    amount: number;
    bank_code: string;
    account_number: string;
    account_name: string;
  }): Promise<Withdrawal> {
    const supabase = await createClient();

    // Validate amount
    if (params.amount <= 0) {
      throw new Error("Withdrawal amount must be greater than 0");
    }

    // Get wallet
    const wallet = await this.getBalance(params.user_id);

    // Calculate withdrawal fee using database function
    const { data: feeData, error: feeError } = await (supabase as any).rpc(
      "calculate_withdrawal_fee",
      { amount: params.amount },
    );

    if (feeError) {
      throw new Error(`Failed to calculate fee: ${feeError.message}`);
    }

    const fee = feeData as number;
    const netAmount = params.amount - fee;

    // Check sufficient balance (amount includes fee)
    if (wallet.available_balance < params.amount) {
      throw new Error("Insufficient wallet balance for withdrawal");
    }

    // Check if additional verification required (>₦100,000)
    const requiresVerification = params.amount > 100000;

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await (supabase as any)
      .from("withdrawals")
      .insert({
        wallet_id: wallet.id,
        user_id: params.user_id,
        amount: params.amount,
        fee: fee,
        net_amount: netAmount,
        bank_code: params.bank_code,
        account_number: params.account_number,
        account_name: params.account_name,
        status: requiresVerification ? "pending" : "processing",
        requires_verification: requiresVerification,
      })
      .select()
      .single();

    if (withdrawalError) {
      throw new Error(
        `Failed to create withdrawal request: ${withdrawalError.message}`,
      );
    }

    // If no verification required, process immediately
    if (!requiresVerification) {
      // Debit wallet
      await this.debitWallet({
        user_id: params.user_id,
        amount: params.amount - fee,
        fee: fee,
        description: `Withdrawal to ${params.account_name}`,
        category: "withdrawal",
        reference: withdrawal.id,
      });

      // Update wallet total_withdrawn
      const { error: updateError } = await (supabase as any)
        .from("wallets")
        .update({
          total_withdrawn: wallet.total_withdrawn + netAmount,
        })
        .eq("id", wallet.id);

      if (updateError) {
        console.error("Failed to update total_withdrawn:", updateError);
      }

      // TODO: Initiate Paystack transfer (Requirement 5.3, 5.4)
      // This will be implemented in the next step
      // For now, mark as processing
    }

    // TODO: Send notification for withdrawal request (Requirement 5.9)
    // This will be implemented when notification system is available

    return withdrawal as Withdrawal;
  }

  /**
   * Process withdrawal with Paystack Transfer API
   * Requirements: 5.3, 5.4
   */
  async processWithdrawal(withdrawalId: string): Promise<Withdrawal> {
    const supabase = await createClient();

    // Get withdrawal
    const { data: withdrawal, error: fetchError } = await (supabase as any)
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) {
      throw new Error(`Withdrawal not found: ${fetchError.message}`);
    }

    // Validate status
    if (withdrawal.status !== "processing") {
      throw new Error(
        `Cannot process withdrawal with status: ${withdrawal.status}`,
      );
    }

    try {
      // Create transfer recipient in Paystack
      const recipientResponse = await paystackClient.createRecipient({
        type: "nuban",
        name: withdrawal.account_name,
        account_number: withdrawal.account_number,
        bank_code: withdrawal.bank_code,
        currency: "NGN",
      });

      // Generate unique reference
      const reference = `withdrawal_${Date.now()}_${withdrawal.id.substring(0, 8)}`;

      // Initiate transfer (amount in kobo)
      const transferResponse = await paystackClient.initiateTransfer({
        source: "balance",
        amount: Math.round(withdrawal.net_amount * 100), // Convert to kobo
        recipient: recipientResponse.data.recipient_code,
        reason: `Withdrawal to ${withdrawal.account_name}`,
        reference,
      });

      // Update withdrawal with Paystack references
      const { data: updatedWithdrawal, error: updateError } = await (
        supabase as any
      )
        .from("withdrawals")
        .update({
          status: "completed",
          paystack_reference: reference,
          paystack_transfer_code: transferResponse.data.transfer_code,
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update withdrawal: ${updateError.message}`);
      }

      // TODO: Send notification for successful withdrawal (Requirement 5.9)

      return updatedWithdrawal as Withdrawal;
    } catch (error) {
      // Mark withdrawal as failed
      const { data: failedWithdrawal } = await (supabase as any)
        .from("withdrawals")
        .update({
          status: "failed",
          failure_reason:
            error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", withdrawalId)
        .select()
        .single();

      throw new Error(
        `Withdrawal processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify large withdrawal (>₦100,000)
   * Requirements: 5.10
   */
  async verifyWithdrawal(params: {
    withdrawal_id: string;
    verified_by: string;
  }): Promise<Withdrawal> {
    const supabase = await createClient();

    // Get withdrawal
    const { data: withdrawal, error: fetchError } = await (supabase as any)
      .from("withdrawals")
      .select("*")
      .eq("id", params.withdrawal_id)
      .single();

    if (fetchError) {
      throw new Error(`Withdrawal not found: ${fetchError.message}`);
    }

    // Validate requires verification
    if (!withdrawal.requires_verification) {
      throw new Error("This withdrawal does not require verification");
    }

    // Validate status
    if (withdrawal.status !== "pending") {
      throw new Error(
        `Cannot verify withdrawal with status: ${withdrawal.status}`,
      );
    }

    // Update withdrawal status
    const { data: updatedWithdrawal, error: updateError } = await (
      supabase as any
    )
      .from("withdrawals")
      .update({
        status: "processing",
        verified_at: new Date().toISOString(),
        verified_by: params.verified_by,
      })
      .eq("id", params.withdrawal_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to verify withdrawal: ${updateError.message}`);
    }

    // Debit wallet
    await this.debitWallet({
      user_id: withdrawal.user_id,
      amount: withdrawal.amount - withdrawal.fee,
      fee: withdrawal.fee,
      description: `Withdrawal to ${withdrawal.account_name}`,
      category: "withdrawal",
      reference: withdrawal.id,
    });

    // Update wallet total_withdrawn
    const { data: wallet } = await (supabase as any)
      .from("wallets")
      .select("*")
      .eq("id", withdrawal.wallet_id)
      .single();

    if (wallet) {
      await (supabase as any)
        .from("wallets")
        .update({
          total_withdrawn: wallet.total_withdrawn + withdrawal.net_amount,
        })
        .eq("id", withdrawal.wallet_id);
    }

    // Process withdrawal with Paystack
    await this.processWithdrawal(params.withdrawal_id);

    return updatedWithdrawal as Withdrawal;
  }

  /**
   * Get withdrawal by ID
   */
  async getWithdrawal(withdrawalId: string): Promise<Withdrawal | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch withdrawal: ${error.message}`);
    }

    return data as Withdrawal;
  }

  /**
   * Get user's withdrawal history
   */
  async getUserWithdrawals(params: {
    user_id: string;
    status?: Withdrawal["status"];
    limit?: number;
    offset?: number;
  }): Promise<Withdrawal[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("withdrawals")
      .select("*")
      .eq("user_id", params.user_id);

    // Filter by status if provided
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
      throw new Error(`Failed to fetch withdrawals: ${error.message}`);
    }

    return (data as Withdrawal[]) || [];
  }

  /**
   * Get wallet details with full information
   */
  async getWalletDetails(user_id: string): Promise<Wallet> {
    return this.getBalance(user_id);
  }

  /**
   * Get transaction history (alias for getTransactions)
   */
  async getTransactionHistory(
    user_id: string,
    options?: {
      category?:
        | "escrow_release"
        | "withdrawal"
        | "refund"
        | "purchase"
        | "fee"
        | "adjustment";
      limit?: number;
      offset?: number;
    },
  ): Promise<WalletTransaction[]> {
    return this.getTransactions({
      user_id,
      category: options?.category,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Get audit log for wallet operations
   */
  async getAuditLog(user_id: string): Promise<
    Array<{
      action: string;
      timestamp: string;
      amount?: number;
      description?: string;
    }>
  > {
    const transactions = await this.getTransactions({ user_id, limit: 100 });

    return transactions.map((tx) => ({
      action: `${tx.type}_${tx.category}`,
      timestamp: tx.created_at,
      amount: tx.amount,
      description: tx.description,
    }));
  }
}

// Export singleton instance
export const walletService = new WalletService();
