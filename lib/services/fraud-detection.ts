/**
 * Fraud Detection Engine
 *
 * Advanced fraud detection system that analyzes user behavior patterns,
 * detects suspicious activity, and calculates risk scores.
 *
 * Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9
 * Task: 26
 */

import { createClient } from "@/lib/supabase/server";
import type {
  FraudScore,
  FraudScoreInsert,
  FraudScoreUpdate,
  FraudFactors,
  FraudMetrics,
  RiskLevel,
  FraudAlert,
} from "@/types/moderation";

/**
 * User behavior pattern data
 */
export interface UserBehaviorPattern {
  userId: string;
  listingFrequency: number; // Listings per day
  averagePrice: number;
  priceVariance: number;
  messageResponseTime: number; // Minutes
  messageResponseRate: number; // Percentage
  accountAgeDays: number;
}

/**
 * Transaction pattern data
 */
export interface TransactionPattern {
  userId: string;
  totalTransactions: number;
  failedTransactions: number;
  successfulTransactions: number;
  averageTransactionValue: number;
  rapidTransactionCount: number; // Transactions in last 24h
}

/**
 * Network connection data for fraud ring detection
 */
export interface NetworkConnection {
  userId: string;
  connectedUserIds: string[];
  sharedPhoneNumbers: string[];
  sharedNINs: string[];
  sharedIPAddresses: string[];
  connectionStrength: number; // 0-100
}

/**
 * Fraud Detection Engine
 *
 * Provides comprehensive fraud detection including:
 * - User behavior pattern analysis
 * - Suspicious activity flagging
 * - Coordinated fraud ring detection
 * - High-risk account suspension
 * - Payment pattern analysis
 * - Duplicate account detection
 * - Velocity abuse monitoring
 * - Risk scoring algorithm
 * - Fraud alerts for users
 */
export class FraudDetectionEngine {
  private readonly CALCULATION_VERSION = "1.0";
  private readonly HIGH_RISK_THRESHOLD = 80;
  private readonly CRITICAL_RISK_THRESHOLD = 80;

  /**
   * Analyze user behavior patterns
   *
   * Requirements: 24.1
   * Task: 26.1
   *
   * @param userId - User ID to analyze
   * @returns Behavior pattern data
   */
  async analyzeUserBehavior(
    userId: string,
  ): Promise<UserBehaviorPattern | null> {
    try {
      const supabase = await createClient();

      // Get user account age
      const { data: user } = await supabase
        .from("users")
        .select("created_at")
        .eq("id", userId)
        .single();

      if (!user || !user.created_at) return null;

      const accountAgeDays = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Get listing frequency (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: listings } = await (supabase as any)
        .from("listings")
        .select("id, price, created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString());

      const listingCount = listings?.length || 0;
      const listingFrequency = listingCount / 30; // Per day

      // Calculate price statistics
      const prices =
        listings?.map((l: any) => l.price ?? 0).filter((p: number) => p > 0) ||
        [];
      const averagePrice =
        prices.length > 0
          ? prices.reduce((sum: number, p: number) => sum + p, 0) /
            prices.length
          : 0;

      const priceVariance =
        prices.length > 1
          ? Math.sqrt(
              prices.reduce(
                (sum: number, p: number) => sum + Math.pow(p - averagePrice, 2),
                0,
              ) / prices.length,
            )
          : 0;

      // Get message response metrics (last 30 days)
      const { data: conversations } = await supabase
        .from("conversations")
        .select(
          `
          id,
          messages (
            id,
            sender_id,
            created_at
          )
        `,
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .gte("created_at", thirtyDaysAgo.toISOString());

      let totalResponseTime = 0;
      let responseCount = 0;
      let messagesReceived = 0;

      conversations?.forEach((conv: any) => {
        const messages = conv.messages || [];
        for (let i = 1; i < messages.length; i++) {
          const prevMsg = messages[i - 1];
          const currMsg = messages[i];

          // If current message is from user and previous was not
          if (currMsg.sender_id === userId && prevMsg.sender_id !== userId) {
            messagesReceived++;
            const responseTime =
              (new Date(currMsg.created_at).getTime() -
                new Date(prevMsg.created_at).getTime()) /
              (1000 * 60); // Minutes
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      });

      const messageResponseTime =
        responseCount > 0 ? totalResponseTime / responseCount : 0;
      const messageResponseRate =
        messagesReceived > 0 ? (responseCount / messagesReceived) * 100 : 0;

      return {
        userId,
        listingFrequency,
        averagePrice,
        priceVariance,
        messageResponseTime,
        messageResponseRate,
        accountAgeDays,
      };
    } catch (error) {
      console.error("Error analyzing user behavior:", error);
      return null;
    }
  }

  /**
   * Detect listing frequency anomalies
   *
   * Requirements: 24.1, 24.7
   * Task: 26.1, 26.10
   *
   * @param behavior - User behavior pattern
   * @returns Anomaly score (0-100)
   */
  detectListingFrequencyAnomaly(behavior: UserBehaviorPattern): number {
    // Flag if posting more than 10 listings per day
    if (behavior.listingFrequency > 10) {
      return Math.min(100, 50 + behavior.listingFrequency * 5);
    }

    // Flag if new account (<7 days) posting more than 5 per day
    if (behavior.accountAgeDays < 7 && behavior.listingFrequency > 5) {
      return Math.min(100, 60 + behavior.listingFrequency * 8);
    }

    return 0;
  }

  /**
   * Identify pricing anomalies
   *
   * Requirements: 24.1
   * Task: 26.1
   *
   * @param behavior - User behavior pattern
   * @param categoryAverage - Category average price
   * @returns Anomaly score (0-100)
   */
  detectPricingAnomaly(
    behavior: UserBehaviorPattern,
    categoryAverage?: number,
  ): number {
    let score = 0;

    // Check if prices are suspiciously low compared to category average
    if (categoryAverage && behavior.averagePrice < categoryAverage * 0.3) {
      score += 40;
    }

    // Check for high price variance (inconsistent pricing)
    if (behavior.priceVariance > behavior.averagePrice * 0.8) {
      score += 30;
    }

    // Check for suspiciously round numbers (e.g., 1000, 5000, 10000)
    const isRoundNumber =
      behavior.averagePrice % 1000 === 0 && behavior.averagePrice >= 1000;
    if (isRoundNumber) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Track communication patterns
   *
   * Requirements: 24.1
   * Task: 26.1
   *
   * @param behavior - User behavior pattern
   * @returns Anomaly score (0-100)
   */
  detectCommunicationAnomaly(behavior: UserBehaviorPattern): number {
    let score = 0;

    // Flag very slow response times (>24 hours)
    if (behavior.messageResponseTime > 1440) {
      score += 30;
    }

    // Flag very low response rates (<30%)
    if (behavior.messageResponseRate < 30) {
      score += 40;
    }

    // Flag if never responding
    if (behavior.messageResponseRate === 0) {
      score += 60;
    }

    return Math.min(100, score);
  }

  /**
   * Flag accounts with suspicious activity
   *
   * Requirements: 24.2
   * Task: 26.3
   *
   * @param userId - User ID to check
   * @returns Suspicious activity flags
   */
  async flagSuspiciousActivity(userId: string): Promise<{
    hasMultipleFailedTransactions: boolean;
    hasBuyerComplaints: boolean;
    failedTransactionCount: number;
    complaintCount: number;
    score: number;
  }> {
    try {
      const supabase = await createClient();

      // Check for failed transactions
      const { data: failedTransactions } = await supabase
        .from("escrow_transactions")
        .select("id")
        .eq("seller_id", userId)
        .eq("status", "refunded")
        .gte(
          "created_at",
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        ); // Last 90 days

      const failedTransactionCount = failedTransactions?.length || 0;
      const hasMultipleFailedTransactions = failedTransactionCount >= 3;

      // Check for buyer complaints (low ratings with negative reviews)
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, comment")
        .eq("seller_id", userId)
        .lte("rating", 2)
        .gte(
          "created_at",
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        );

      const complaintCount = reviews?.length || 0;
      const hasBuyerComplaints = complaintCount >= 3;

      // Calculate score
      let score = 0;
      if (hasMultipleFailedTransactions) {
        score += Math.min(50, failedTransactionCount * 10);
      }
      if (hasBuyerComplaints) {
        score += Math.min(50, complaintCount * 10);
      }

      return {
        hasMultipleFailedTransactions,
        hasBuyerComplaints,
        failedTransactionCount,
        complaintCount,
        score: Math.min(100, score),
      };
    } catch (error) {
      console.error("Error flagging suspicious activity:", error);
      return {
        hasMultipleFailedTransactions: false,
        hasBuyerComplaints: false,
        failedTransactionCount: 0,
        complaintCount: 0,
        score: 0,
      };
    }
  }

  /**
   * Detect coordinated fraud rings
   *
   * Requirements: 24.3
   * Task: 26.4
   *
   * @param userId - User ID to analyze
   * @returns Network connection data
   */
  async detectFraudRing(userId: string): Promise<NetworkConnection | null> {
    try {
      const supabase = await createClient();

      // Get user's phone and NIN
      const { data: user } = await (supabase as any)
        .from("users")
        .select("phone, nin")
        .eq("id", userId)
        .single();

      if (!user) return null;

      const connectedUserIds: string[] = [];
      const sharedPhoneNumbers: string[] = [];
      const sharedNINs: string[] = [];

      // Find users with same phone number
      if (user.phone) {
        const { data: phoneMatches } = await (supabase as any)
          .from("users")
          .select("id, phone")
          .eq("phone", user.phone)
          .neq("id", userId);

        if (phoneMatches && phoneMatches.length > 0) {
          phoneMatches.forEach((match: any) => {
            connectedUserIds.push(match.id);
            if (match.phone) sharedPhoneNumbers.push(match.phone);
          });
        }
      }

      // Find users with same NIN
      if (user.nin) {
        const { data: ninMatches } = await (supabase as any)
          .from("users")
          .select("id, nin")
          .eq("nin", user.nin)
          .neq("id", userId);

        if (ninMatches && ninMatches.length > 0) {
          ninMatches.forEach((match: any) => {
            if (!connectedUserIds.includes(match.id)) {
              connectedUserIds.push(match.id);
            }
            if (match.nin) sharedNINs.push(match.nin);
          });
        }
      }

      // Calculate connection strength
      let connectionStrength = 0;
      if (sharedPhoneNumbers.length > 0) connectionStrength += 50;
      if (sharedNINs.length > 0) connectionStrength += 50;

      return {
        userId,
        connectedUserIds,
        sharedPhoneNumbers,
        sharedNINs,
        sharedIPAddresses: [], // TODO: Implement IP tracking
        connectionStrength: Math.min(100, connectionStrength),
      };
    } catch (error) {
      console.error("Error detecting fraud ring:", error);
      return null;
    }
  }

  /**
   * Analyze payment patterns
   *
   * Requirements: 24.5
   * Task: 26.7
   *
   * @param userId - User ID to analyze
   * @returns Payment pattern analysis
   */
  async analyzePaymentPatterns(userId: string): Promise<{
    suspiciousPatterns: string[];
    score: number;
  }> {
    try {
      const supabase = await createClient();

      const suspiciousPatterns: string[] = [];
      let score = 0;

      // Get recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions } = await supabase
        .from("escrow_transactions")
        .select("amount, status, created_at")
        .eq("seller_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (!transactions || transactions.length === 0) {
        return { suspiciousPatterns, score: 0 };
      }

      // Check for rapid high-value transactions
      const highValueTransactions = transactions.filter(
        (t) => t.amount > 100000,
      );
      if (highValueTransactions.length > 5) {
        suspiciousPatterns.push("Multiple high-value transactions");
        score += 30;
      }

      // Check for round-number transactions (money laundering indicator)
      const roundNumberTransactions = transactions.filter(
        (t) => t.amount % 10000 === 0 && t.amount >= 10000,
      );
      if (roundNumberTransactions.length > 3) {
        suspiciousPatterns.push("Frequent round-number transactions");
        score += 25;
      }

      // Check for rapid transaction velocity
      const transactionsPerDay = transactions.length / 30;
      if (transactionsPerDay > 10) {
        suspiciousPatterns.push("Unusually high transaction velocity");
        score += 20;
      }

      // Check for structuring (breaking large amounts into smaller ones)
      const similarAmountGroups = this.findSimilarAmountGroups(transactions);
      if (similarAmountGroups.length > 2) {
        suspiciousPatterns.push("Potential transaction structuring");
        score += 35;
      }

      return {
        suspiciousPatterns,
        score: Math.min(100, score),
      };
    } catch (error) {
      console.error("Error analyzing payment patterns:", error);
      return { suspiciousPatterns: [], score: 0 };
    }
  }

  /**
   * Find groups of transactions with similar amounts
   */
  private findSimilarAmountGroups(
    transactions: Array<{ amount: number }>,
  ): Array<Array<{ amount: number }>> {
    const groups: Array<Array<{ amount: number }>> = [];
    const tolerance = 0.1; // 10% tolerance

    for (let i = 0; i < transactions.length; i++) {
      const group = [transactions[i]];
      for (let j = i + 1; j < transactions.length; j++) {
        const diff = Math.abs(transactions[i].amount - transactions[j].amount);
        if (diff / transactions[i].amount <= tolerance) {
          group.push(transactions[j]);
        }
      }
      if (group.length >= 3) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Detect duplicate accounts
   *
   * Requirements: 24.6
   * Task: 26.8
   *
   * @param userId - User ID to check
   * @returns Duplicate account detection result
   */
  async detectDuplicateAccounts(userId: string): Promise<{
    hasDuplicates: boolean;
    duplicateUserIds: string[];
    matchType: string[];
    score: number;
  }> {
    try {
      const supabase = await createClient();

      // Get user's phone and NIN
      const { data: user } = await (supabase as any)
        .from("users")
        .select("phone, nin")
        .eq("id", userId)
        .single();

      if (!user) {
        return {
          hasDuplicates: false,
          duplicateUserIds: [],
          matchType: [],
          score: 0,
        };
      }

      const duplicateUserIds: string[] = [];
      const matchType: string[] = [];
      let score = 0;

      // Check for phone number matches
      if (user.phone) {
        const { data: phoneMatches } = await (supabase as any)
          .from("users")
          .select("id")
          .eq("phone", user.phone)
          .neq("id", userId);

        if (phoneMatches && phoneMatches.length > 0) {
          phoneMatches.forEach((match: any) => {
            if (!duplicateUserIds.includes(match.id)) {
              duplicateUserIds.push(match.id);
            }
          });
          matchType.push("phone");
          score += 40;
        }
      }

      // Check for NIN matches
      if (user.nin) {
        const { data: ninMatches } = await (supabase as any)
          .from("users")
          .select("id")
          .eq("nin", user.nin)
          .neq("id", userId);

        if (ninMatches && ninMatches.length > 0) {
          ninMatches.forEach((match: any) => {
            if (!duplicateUserIds.includes(match.id)) {
              duplicateUserIds.push(match.id);
            }
          });
          matchType.push("nin");
          score += 60;
        }
      }

      return {
        hasDuplicates: duplicateUserIds.length > 0,
        duplicateUserIds,
        matchType,
        score: Math.min(100, score),
      };
    } catch (error) {
      console.error("Error detecting duplicate accounts:", error);
      return {
        hasDuplicates: false,
        duplicateUserIds: [],
        matchType: [],
        score: 0,
      };
    }
  }

  /**
   * Monitor velocity abuse
   *
   * Requirements: 24.7
   * Task: 26.10
   *
   * @param userId - User ID to monitor
   * @returns Velocity abuse detection result
   */
  async monitorVelocityAbuse(userId: string): Promise<{
    rapidAccountCreation: boolean;
    rapidListingPosting: boolean;
    accountCreationRate: number;
    listingPostingRate: number;
    score: number;
  }> {
    try {
      const supabase = await createClient();

      // Get user's account creation date
      const { data: user } = await (supabase as any)
        .from("users")
        .select("created_at, phone, nin")
        .eq("id", userId)
        .single();

      if (!user) {
        return {
          rapidAccountCreation: false,
          rapidListingPosting: false,
          accountCreationRate: 0,
          listingPostingRate: 0,
          score: 0,
        };
      }

      let score = 0;

      // Check for rapid account creation from same phone/NIN
      let accountCreationRate = 0;
      if (user.phone || user.nin) {
        const { data: relatedAccounts } = await (supabase as any)
          .from("users")
          .select("created_at")
          .or(`phone.eq.${user.phone ?? ""},nin.eq.${user.nin ?? ""}`)
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          ); // Last 7 days

        accountCreationRate = relatedAccounts?.length || 0;
      }

      const rapidAccountCreation = accountCreationRate > 3;
      if (rapidAccountCreation) {
        score += 50;
      }

      // Check for rapid listing posting
      const { data: recentListings } = await supabase
        .from("listings")
        .select("id, created_at")
        .eq("user_id", userId)
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ); // Last 24 hours

      const listingPostingRate = recentListings?.length || 0;
      const rapidListingPosting = listingPostingRate > 20;

      if (rapidListingPosting) {
        score += 50;
      }

      return {
        rapidAccountCreation,
        rapidListingPosting,
        accountCreationRate,
        listingPostingRate,
        score: Math.min(100, score),
      };
    } catch (error) {
      console.error("Error monitoring velocity abuse:", error);
      return {
        rapidAccountCreation: false,
        rapidListingPosting: false,
        accountCreationRate: 0,
        listingPostingRate: 0,
        score: 0,
      };
    }
  }

  /**
   * Calculate comprehensive fraud score
   *
   * Requirements: 24.1, 24.8
   * Task: 26.2
   *
   * @param userId - User ID to score
   * @returns Fraud score (0-100) and risk level
   */
  async calculateFraudScore(userId: string): Promise<{
    fraudScore: number;
    riskLevel: RiskLevel;
    factors: FraudFactors;
    metrics: FraudMetrics;
  }> {
    try {
      // Gather all fraud indicators
      const behavior = await this.analyzeUserBehavior(userId);
      const suspiciousActivity = await this.flagSuspiciousActivity(userId);
      const fraudRing = await this.detectFraudRing(userId);
      const paymentPatterns = await this.analyzePaymentPatterns(userId);
      const duplicateAccounts = await this.detectDuplicateAccounts(userId);
      const velocityAbuse = await this.monitorVelocityAbuse(userId);

      // Calculate individual factor scores
      const factors: FraudFactors = {
        account_age_score: behavior
          ? this.calculateAccountAgeScore(behavior.accountAgeDays)
          : 0,
        failed_transactions_score: suspiciousActivity.score,
        complaints_score: suspiciousActivity.hasBuyerComplaints ? 40 : 0,
        velocity_abuse_score: velocityAbuse.score,
        network_risk_score: fraudRing?.connectionStrength || 0,
        pricing_anomaly_score: behavior
          ? this.detectPricingAnomaly(behavior)
          : 0,
        duplicate_account_score: duplicateAccounts.score,
      };

      // Collect detailed metrics
      const metrics: FraudMetrics = {
        account_age_days: behavior?.accountAgeDays || 0,
        failed_transaction_count: suspiciousActivity.failedTransactionCount,
        complaint_count: suspiciousActivity.complaintCount,
        rapid_listing_count: velocityAbuse.listingPostingRate,
        suspicious_price_count: 0, // TODO: Track this separately
        linked_accounts: fraudRing?.connectedUserIds || [],
      };

      // Calculate weighted fraud score
      const weights = {
        account_age: 0.1,
        failed_transactions: 0.2,
        complaints: 0.15,
        velocity_abuse: 0.15,
        network_risk: 0.2,
        pricing_anomaly: 0.1,
        duplicate_account: 0.1,
      };

      const fraudScore = Math.min(
        100,
        Math.round(
          (factors.account_age_score || 0) * weights.account_age +
            (factors.failed_transactions_score || 0) *
              weights.failed_transactions +
            (factors.complaints_score || 0) * weights.complaints +
            (factors.velocity_abuse_score || 0) * weights.velocity_abuse +
            (factors.network_risk_score || 0) * weights.network_risk +
            (factors.pricing_anomaly_score || 0) * weights.pricing_anomaly +
            (factors.duplicate_account_score || 0) * weights.duplicate_account,
        ),
      );

      // Determine risk level
      const riskLevel = this.calculateRiskLevel(fraudScore);

      return {
        fraudScore,
        riskLevel,
        factors,
        metrics,
      };
    } catch (error) {
      console.error("Error calculating fraud score:", error);
      return {
        fraudScore: 0,
        riskLevel: "low",
        factors: {},
        metrics: {},
      };
    }
  }

  /**
   * Calculate account age risk score
   */
  private calculateAccountAgeScore(accountAgeDays: number): number {
    if (accountAgeDays < 1) return 80;
    if (accountAgeDays < 7) return 60;
    if (accountAgeDays < 30) return 40;
    if (accountAgeDays < 90) return 20;
    return 0;
  }

  /**
   * Calculate risk level from fraud score
   *
   * Requirements: 24.8
   * Task: 26.2
   */
  private calculateRiskLevel(fraudScore: number): RiskLevel {
    if (fraudScore >= 80) return "critical";
    if (fraudScore >= 60) return "high";
    if (fraudScore >= 40) return "medium";
    return "low";
  }

  /**
   * Suspend high-risk accounts
   *
   * Requirements: 24.4
   * Task: 26.5
   *
   * @param userId - User ID to suspend
   * @param fraudScore - Fraud score
   * @param reason - Suspension reason
   * @param suspendedBy - Admin user ID (optional)
   * @returns Success status
   */
  async suspendHighRiskAccount(
    userId: string,
    fraudScore: number,
    reason: string,
    suspendedBy?: string,
  ): Promise<boolean> {
    try {
      // Only suspend if fraud score exceeds threshold
      if (fraudScore <= this.HIGH_RISK_THRESHOLD) {
        return false;
      }

      const supabase = await createClient();

      // Update fraud score with suspension
      const { error: fraudError } = await supabase
        .from("fraud_scores")
        .update({
          is_suspended: true,
          suspension_reason: reason,
          suspended_at: new Date().toISOString(),
          suspended_by: suspendedBy || null,
        })
        .eq("user_id", userId);

      if (fraudError) {
        console.error("Error updating fraud score:", fraudError);
        return false;
      }

      // Deactivate all user's listings
      const { error: listingsError } = await (supabase as any)
        .from("listings")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (listingsError) {
        console.error("Error suspending listings:", listingsError);
      }

      // Send suspension notification
      await this.sendFraudAlert(userId, {
        type: "account_suspended",
        message: `Your account has been suspended due to high fraud risk. Reason: ${reason}`,
        timestamp: new Date().toISOString(),
        severity: "high",
      });

      return true;
    } catch (error) {
      console.error("Error suspending high-risk account:", error);
      return false;
    }
  }

  /**
   * Send fraud alert to user
   *
   * Requirements: 24.9
   * Task: 26.11
   *
   * @param userId - User ID to alert
   * @param alert - Alert details
   */
  async sendFraudAlert(userId: string, alert: FraudAlert): Promise<void> {
    try {
      const supabase = await createClient();

      // Get current fraud score
      const { data: fraudScore } = await supabase
        .from("fraud_scores")
        .select("alerts_sent")
        .eq("user_id", userId)
        .single();

      const existingAlerts =
        (fraudScore?.alerts_sent as any as FraudAlert[]) || [];
      const updatedAlerts = [...existingAlerts, alert] as any;

      // Update fraud score with new alert
      await (supabase as any)
        .from("fraud_scores")
        .update({
          alerts_sent: updatedAlerts,
          last_alert_sent_at: alert.timestamp,
        })
        .eq("user_id", userId);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "fraud_alert",
        title: "Security Alert",
        message: alert.message,
        data: { alert_type: alert.type, severity: alert.severity },
      });
    } catch (error) {
      console.error("Error sending fraud alert:", error);
    }
  }

  /**
   * Get fraud alert for flagged account interaction
   *
   * Requirements: 24.9
   * Task: 26.11
   *
   * @param targetUserId - User ID to check
   * @returns Alert message if user is flagged
   */
  async getFraudAlertForUser(targetUserId: string): Promise<string | null> {
    try {
      const supabase = await createClient();

      const { data: fraudScore } = await supabase
        .from("fraud_scores")
        .select("fraud_score, risk_level, is_suspended")
        .eq("user_id", targetUserId)
        .single();

      if (!fraudScore) return null;

      if (fraudScore.is_suspended) {
        return "⚠️ Warning: This account has been suspended due to suspicious activity.";
      }

      if (
        fraudScore.risk_level === "critical" ||
        fraudScore.risk_level === "high"
      ) {
        return "⚠️ Caution: This account has been flagged for suspicious activity. Please exercise caution when transacting.";
      }

      if (fraudScore.risk_level === "medium") {
        return "ℹ️ Notice: This account is relatively new or has limited transaction history.";
      }

      return null;
    } catch (error) {
      console.error("Error getting fraud alert:", error);
      return null;
    }
  }

  /**
   * Update or create fraud score for user
   *
   * Requirements: 24.1, 24.8
   * Task: 26.2
   *
   * @param userId - User ID to update
   * @returns Updated fraud score
   */
  async updateFraudScore(userId: string): Promise<FraudScore | null> {
    try {
      const supabase = await createClient();

      // Calculate new fraud score
      const { fraudScore, riskLevel, factors, metrics } =
        await this.calculateFraudScore(userId);

      // Check if fraud score exists
      const { data: existing } = await supabase
        .from("fraud_scores")
        .select("id, is_suspended")
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Update existing score
        const updateData: any = {
          fraud_score: fraudScore,
          risk_level: riskLevel,
          factors: factors as any,
          metrics: metrics as any,
          last_calculated_at: new Date().toISOString(),
          calculation_version: this.CALCULATION_VERSION,
        };

        // Auto-suspend if score exceeds threshold and not already suspended
        if (fraudScore > this.HIGH_RISK_THRESHOLD && !existing.is_suspended) {
          await this.suspendHighRiskAccount(
            userId,
            fraudScore,
            "Automatic suspension: Fraud score exceeded 80%",
          );
        }

        const { data, error } = await (supabase as any)
          .from("fraud_scores")
          .update(updateData)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          console.error("Error updating fraud score:", error);
          return null;
        }

        return data as FraudScore;
      } else {
        // Create new score
        const insertData: any = {
          user_id: userId,
          fraud_score: fraudScore,
          risk_level: riskLevel,
          factors: factors as any,
          metrics: metrics as any,
          calculation_version: this.CALCULATION_VERSION,
        };

        const { data, error } = await (supabase as any)
          .from("fraud_scores")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Error creating fraud score:", error);
          return null;
        }

        // Auto-suspend if score exceeds threshold
        if (fraudScore > this.HIGH_RISK_THRESHOLD) {
          await this.suspendHighRiskAccount(
            userId,
            fraudScore,
            "Automatic suspension: Fraud score exceeded 80%",
          );
        }

        return data as FraudScore;
      }
    } catch (error) {
      console.error("Error updating fraud score:", error);
      return null;
    }
  }

  /**
   * Get fraud score for user
   *
   * @param userId - User ID
   * @returns Fraud score or null
   */
  async getFraudScore(userId: string): Promise<FraudScore | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await (supabase as any)
        .from("fraud_scores")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error getting fraud score:", error);
        return null;
      }

      return data as FraudScore;
    } catch (error) {
      console.error("Error getting fraud score:", error);
      return null;
    }
  }

  /**
   * Generate transaction risk score
   *
   * Requirements: 24.8
   * Task: 26.2
   *
   * @param buyerId - Buyer user ID
   * @param sellerId - Seller user ID
   * @param itemValue - Transaction value
   * @returns Transaction risk score (0-100)
   */
  async generateTransactionRiskScore(
    buyerId: string,
    sellerId: string,
    itemValue: number,
  ): Promise<{
    riskScore: number;
    riskLevel: RiskLevel;
    factors: string[];
  }> {
    try {
      const supabase = await createClient();

      let riskScore = 0;
      const factors: string[] = [];

      // Get seller's fraud score
      const { data: sellerFraudScore } = await supabase
        .from("fraud_scores")
        .select("fraud_score, risk_level")
        .eq("user_id", sellerId)
        .single();

      if (sellerFraudScore) {
        riskScore += sellerFraudScore.fraud_score * 0.5;
        if (
          sellerFraudScore.risk_level === "high" ||
          sellerFraudScore.risk_level === "critical"
        ) {
          factors.push("Seller has high fraud risk");
        }
      }

      // Get buyer's fraud score
      const { data: buyerFraudScore } = await supabase
        .from("fraud_scores")
        .select("fraud_score, risk_level")
        .eq("user_id", buyerId)
        .single();

      if (buyerFraudScore) {
        riskScore += buyerFraudScore.fraud_score * 0.3;
        if (
          buyerFraudScore.risk_level === "high" ||
          buyerFraudScore.risk_level === "critical"
        ) {
          factors.push("Buyer has high fraud risk");
        }
      }

      // Check transaction history between buyer and seller
      const { data: previousTransactions } = await supabase
        .from("escrow_transactions")
        .select("status")
        .eq("buyer_id", buyerId)
        .eq("seller_id", sellerId);

      if (previousTransactions && previousTransactions.length > 0) {
        const failedCount = previousTransactions.filter(
          (t) => t.status === "refunded" || t.status === "disputed",
        ).length;

        if (failedCount > 0) {
          riskScore += failedCount * 10;
          factors.push("Previous failed transactions between parties");
        }
      } else {
        // First transaction between parties
        riskScore += 10;
        factors.push("First transaction between parties");
      }

      // Check item value
      if (itemValue > 500000) {
        riskScore += 20;
        factors.push("High-value transaction");
      } else if (itemValue > 200000) {
        riskScore += 10;
        factors.push("Medium-high value transaction");
      }

      riskScore = Math.min(100, Math.round(riskScore));
      const riskLevel = this.calculateRiskLevel(riskScore);

      return {
        riskScore,
        riskLevel,
        factors,
      };
    } catch (error) {
      console.error("Error generating transaction risk score:", error);
      return {
        riskScore: 0,
        riskLevel: "low",
        factors: [],
      };
    }
  }
}

/**
 * Create a singleton instance of FraudDetectionEngine
 */
export const fraudDetectionEngine = new FraudDetectionEngine();
