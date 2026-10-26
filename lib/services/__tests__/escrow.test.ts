/**
 * Unit Tests for EscrowService
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EscrowService } from "../escrow";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Paystack client
vi.mock("@/lib/paystack/client", () => ({
  paystackClient: {
    initializeTransaction: vi.fn(),
    verifyTransaction: vi.fn(),
  },
}));

describe("EscrowService", () => {
  let escrowService: EscrowService;

  beforeEach(() => {
    escrowService = new EscrowService();
    vi.clearAllMocks();
  });

  describe("initializeEscrow", () => {
    it("should validate amount is positive", async () => {
      await expect(
        escrowService.initializeEscrow({
          listing_id: "test-listing",
          buyer_id: "buyer-1",
          seller_id: "seller-1",
          amount: -100,
          buyer_email: "buyer@test.com",
        }),
      ).rejects.toThrow("Amount must be greater than 0");
    });

    it("should validate buyer and seller are different", async () => {
      await expect(
        escrowService.initializeEscrow({
          listing_id: "test-listing",
          buyer_id: "user-1",
          seller_id: "user-1",
          amount: 1000,
          buyer_email: "user@test.com",
        }),
      ).rejects.toThrow("Buyer and seller must be different users");
    });
  });
});
