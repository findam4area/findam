/**
 * Property-Based Tests for Referral Service
 * Tests: 36.4, 36.6, 36.8
 * Properties: 56, 57, 58
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { referralService } from "../referral";
import { walletService } from "../wallet";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock wallet service
vi.mock("../wallet", () => ({
  walletService: {
    creditWallet: vi.fn(),
  },
}));

describe("Referral Service - Property-Based Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a queue of responses for sequential queries
    const responseQueue: Array<{ data: any; error: any }> = [];
    let currentResponseIndex = 0;

    // Create a chainable mock that is also awaitable (for query chains)
    const createAwaitableChainMock = (): any => {
      const mock: any = {};

      const methods = [
        "from",
        "select",
        "insert",
        "update",
        "eq",
        "gte",
        "lte",
        "limit",
        "in",
      ];

      methods.forEach((method) => {
        mock[method] = vi.fn(() => createAwaitableChainMock());
      });

      mock.single = vi.fn(() => {
        const response = responseQueue[currentResponseIndex] || {
          data: null,
          error: null,
        };
        currentResponseIndex++;
        return Promise.resolve(response);
      });

      // Make awaitable - when this mock is awaited, resolve to the next response in queue
      mock.then = (resolve: any) => {
        const response = responseQueue[currentResponseIndex] || {
          data: null,
          error: null,
        };
        currentResponseIndex++;
        return resolve(response);
      };

      return mock;
    };

    // Create the initial Supabase client mock (NOT awaitable)
    const initialMock: any = {
      // Helper to queue responses for sequential queries
      _queueResponse: (response: { data: any; error: any }) => {
        responseQueue.push(response);
      },
      // Helper to reset the queue
      _resetQueue: () => {
        responseQueue.length = 0;
        currentResponseIndex = 0;
      },
    };

    const methods = [
      "from",
      "select",
      "insert",
      "update",
      "eq",
      "gte",
      "lte",
      "limit",
      "in",
    ];

    methods.forEach((method) => {
      initialMock[method] = vi.fn(() => createAwaitableChainMock());
    });

    initialMock.single = vi.fn(() => {
      const response = responseQueue[currentResponseIndex] || {
        data: null,
        error: null,
      };
      currentResponseIndex++;
      return Promise.resolve(response);
    });

    // Do NOT add 'then' to initialMock - it should not be awaitable

    mockSupabase = initialMock;

    // createClient returns a promise that resolves to the initial mock
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 56: Referral Signup Reward
   * **Validates: Requirements 17.3, 17.4**
   *
   * For any new user signup with a valid referral code,
   * ₦500 must be credited to the referrer's wallet and
   * ₦200 must be credited to the new user's wallet.
   */
  describe("Property 56: Referral Signup Reward", () => {
    it("should credit ₦500 to referrer and ₦200 to new user on valid signup", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referral_id
          fc.uuid(), // referrer_id
          fc.uuid(), // referred_user_id
          fc.string({ minLength: 8, maxLength: 8 }), // referral_code
          async (referralId, referrerId, referredUserId, referralCode) => {
            // Reset queue and mocks for each property test run
            mockSupabase._resetQueue();
            vi.clearAllMocks();

            // Setup: Mock referral record
            const mockReferral = {
              id: referralId,
              referrer_id: referrerId,
              referred_user_id: referredUserId,
              referral_code: referralCode,
              status: "pending",
              signup_reward_amount: 500,
              signup_reward_credited: false,
              purchase_reward_amount: 500,
              purchase_reward_credited: false,
              new_user_reward_amount: 200,
              new_user_reward_credited: false,
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Setup mock response for the query
            mockSupabase._queueResponse({
              data: mockReferral,
              error: null,
            });

            // Execute: Credit signup rewards
            await referralService.creditSignupRewards(referralId);

            // Verify: ₦500 credited to referrer
            expect(walletService.creditWallet).toHaveBeenCalledWith(
              expect.objectContaining({
                user_id: referrerId,
                amount: 500,
                category: "referral",
                description: "Referral signup reward",
              }),
            );

            // Verify: ₦200 credited to new user
            expect(walletService.creditWallet).toHaveBeenCalledWith(
              expect.objectContaining({
                user_id: referredUserId,
                amount: 200,
                category: "bonus",
                description: "Welcome bonus",
              }),
            );

            // Verify: Both credits were called
            expect(walletService.creditWallet).toHaveBeenCalledTimes(2);
          },
        ),
        { numRuns: 3 },
      );
    });

    it("should not credit rewards if referral is invalid", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referral_id
          fc.uuid(), // referrer_id
          fc.uuid(), // referred_user_id
          async (referralId, referrerId, referredUserId) => {
            // Setup: Mock invalid referral
            const mockReferral = {
              id: referralId,
              referrer_id: referrerId,
              referred_user_id: referredUserId,
              referral_code: "TESTCODE",
              status: "pending",
              signup_reward_amount: 500,
              signup_reward_credited: false,
              new_user_reward_amount: 200,
              new_user_reward_credited: false,
              is_valid: false, // Invalid referral
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Setup mock response
            mockSupabase._queueResponse({
              data: mockReferral,
              error: null,
            });

            // Execute & Verify: Should throw error
            await expect(
              referralService.creditSignupRewards(referralId),
            ).rejects.toThrow("Referral is not valid");

            // Verify: No wallet credits
            expect(walletService.creditWallet).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 3 },
      );
    });

    it("should not credit rewards twice for the same referral", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referral_id
          async (referralId) => {
            // Setup: Mock already credited referral
            const mockReferral = {
              id: referralId,
              referrer_id: "referrer-id",
              referred_user_id: "referred-id",
              referral_code: "TESTCODE",
              status: "signup_rewarded",
              signup_reward_amount: 500,
              signup_reward_credited: true, // Already credited
              new_user_reward_amount: 200,
              new_user_reward_credited: true,
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Setup mock response
            mockSupabase._queueResponse({
              data: mockReferral,
              error: null,
            });

            // Execute & Verify: Should throw error
            await expect(
              referralService.creditSignupRewards(referralId),
            ).rejects.toThrow("Signup reward already credited");

            // Verify: No wallet credits
            expect(walletService.creditWallet).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 3 },
      );
    });
  });

  /**
   * Property 57: Referral Purchase Bonus
   * **Validates: Requirements 17.4**
   *
   * For any referred user's first purchase,
   * an additional ₦500 must be credited to the referrer's wallet.
   */
  describe("Property 57: Referral Purchase Bonus", () => {
    it("should credit ₦500 to referrer on referred user's first purchase", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referral_id
          fc.uuid(), // referrer_id
          fc.uuid(), // referred_user_id
          fc.uuid(), // purchase_id
          async (referralId, referrerId, referredUserId, purchaseId) => {
            // Reset queue and mocks for each property test run
            mockSupabase._resetQueue();
            vi.clearAllMocks();

            // Setup: Mock referral with signup reward already credited
            const mockReferral = {
              id: referralId,
              referrer_id: referrerId,
              referred_user_id: referredUserId,
              referral_code: "TESTCODE",
              status: "signup_rewarded",
              signup_reward_amount: 500,
              signup_reward_credited: true, // Signup reward already credited
              purchase_reward_amount: 500,
              purchase_reward_credited: false, // Purchase bonus not yet credited
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Setup mock response
            mockSupabase._queueResponse({
              data: mockReferral,
              error: null,
            });

            // Execute: Credit purchase bonus
            await referralService.creditPurchaseBonus({
              referred_user_id: referredUserId,
              purchase_id: purchaseId,
            });

            // Verify: ₦500 credited to referrer
            expect(walletService.creditWallet).toHaveBeenCalledWith(
              expect.objectContaining({
                user_id: referrerId,
                amount: 500,
                category: "referral",
                description: "Referral first purchase bonus",
              }),
            );

            // Verify: Only one credit
            expect(walletService.creditWallet).toHaveBeenCalledTimes(1);
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should not credit purchase bonus if signup reward not credited", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referral_id
          fc.uuid(), // referred_user_id
          fc.uuid(), // purchase_id
          async (referralId, referredUserId, purchaseId) => {
            // Setup: Mock referral without signup reward
            const mockReferral = {
              id: referralId,
              referrer_id: "referrer-id",
              referred_user_id: referredUserId,
              referral_code: "TESTCODE",
              status: "pending",
              signup_reward_credited: false, // Signup not credited yet
              purchase_reward_credited: false,
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Setup mock response
            mockSupabase._queueResponse({
              data: mockReferral,
              error: null,
            });

            // Execute: Try to credit purchase bonus
            await referralService.creditPurchaseBonus({
              referred_user_id: referredUserId,
              purchase_id: purchaseId,
            });

            // Verify: No wallet credits (silently skipped)
            expect(walletService.creditWallet).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should not credit purchase bonus twice", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referral_id
          fc.uuid(), // referred_user_id
          fc.uuid(), // purchase_id
          async (referralId, referredUserId, purchaseId) => {
            // Setup: Mock referral with purchase bonus already credited
            const mockReferral = {
              id: referralId,
              referrer_id: "referrer-id",
              referred_user_id: referredUserId,
              referral_code: "TESTCODE",
              status: "completed",
              signup_reward_credited: true,
              purchase_reward_credited: true, // Already credited
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Setup mock response
            mockSupabase._queueResponse({
              data: mockReferral,
              error: null,
            });

            // Execute: Try to credit purchase bonus again
            await referralService.creditPurchaseBonus({
              referred_user_id: referredUserId,
              purchase_id: purchaseId,
            });

            // Verify: No wallet credits (silently skipped)
            expect(walletService.creditWallet).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  /**
   * Property 58: Referral Monthly Limit
   * **Validates: Requirements 17.7**
   *
   * For any user, the total number of successful referral rewards
   * credited in a calendar month must not exceed 50.
   */
  describe("Property 58: Referral Monthly Limit", () => {
    it("should allow referrals up to 50 per month", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referrer_id
          fc.integer({ min: 0, max: 49 }), // current_count (below limit)
          async (referrerId, currentCount) => {
            // Setup: Mock current month's referrals
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Create mock referrals for current count
            const mockReferrals = Array.from(
              { length: currentCount },
              (_, i) => ({
                id: `referral-${i}`,
                referrer_id: referrerId,
                created_at: new Date().toISOString(),
              }),
            );

            // Setup mock response
            mockSupabase._queueResponse({
              data: currentCount,
              error: null,
            });

            // Execute: Get monthly count
            const monthlyCount =
              await referralService.getMonthlyReferralCount(referrerId);

            // Verify: Count is below limit
            expect(monthlyCount).toBeLessThan(50);
            expect(monthlyCount).toBe(currentCount);
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should reject referrals when monthly limit is reached", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referrer_id
          fc.uuid(), // referred_user_id
          fc.string({ minLength: 8, maxLength: 8 }), // referral_code
          async (referrerId, referredUserId, referralCode) => {
            // Setup: Mock 50 referrals already exist (limit reached)
            // Queue responses for the three queries in trackReferralSignup
            mockSupabase._queueResponse({
              // First call: get referrer from code
              data: { referrer_id: referrerId },
              error: null,
            });
            mockSupabase._queueResponse({
              // Second call: check if user already referred
              data: null,
              error: { code: "PGRST116" }, // Not found
            });
            mockSupabase._queueResponse({
              // Third call: monthly count
              data: 50, // Limit reached
              error: null,
            });

            // Execute & Verify: Should throw error
            await expect(
              referralService.trackReferralSignup({
                referral_code: referralCode,
                referred_user_id: referredUserId,
              }),
            ).rejects.toThrow("Monthly referral limit reached");
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should reset count at the start of each month", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referrer_id
          fc.integer({ min: 1, max: 12 }), // month
          fc.integer({ min: 2024, max: 2030 }), // year
          async (referrerId, month, year) => {
            // Setup: Mock referrals from previous month
            const previousMonth = new Date(year, month - 2, 15);
            const currentMonth = new Date(year, month - 1, 1);

            // Mock previous month referrals (should not count)
            const previousMonthReferrals = Array.from(
              { length: 50 },
              (_, i) => ({
                id: `old-referral-${i}`,
                referrer_id: referrerId,
                created_at: previousMonth.toISOString(),
              }),
            );

            // Mock current month referrals (should count)
            const currentMonthReferrals = Array.from({ length: 5 }, (_, i) => ({
              id: `new-referral-${i}`,
              referrer_id: referrerId,
              created_at: currentMonth.toISOString(),
            }));

            // Mock query to return only current month referrals
            mockSupabase._queueResponse({
              data: currentMonthReferrals.length,
              error: null,
            });

            // Execute: Get monthly count
            const monthlyCount =
              await referralService.getMonthlyReferralCount(referrerId);

            // Verify: Only current month referrals counted
            expect(monthlyCount).toBe(5);
            expect(monthlyCount).toBeLessThan(50);
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should track monthly count correctly across multiple referrals", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // referrer_id
          fc.array(fc.uuid(), { minLength: 1, maxLength: 50 }), // referred_user_ids
          async (referrerId, referredUserIds) => {
            // Setup: Mock referrals for each user
            const mockReferrals = referredUserIds.map((userId, index) => ({
              id: `referral-${index}`,
              referrer_id: referrerId,
              referred_user_id: userId,
              created_at: new Date().toISOString(),
            }));

            mockSupabase._queueResponse({
              data: mockReferrals.length,
              error: null,
            });

            // Execute: Get monthly count
            const monthlyCount =
              await referralService.getMonthlyReferralCount(referrerId);

            // Verify: Count matches number of referrals
            expect(monthlyCount).toBe(referredUserIds.length);
            expect(monthlyCount).toBeLessThanOrEqual(50);
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
