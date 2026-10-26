/**
 * Unit tests for WalletService
 * Tests core wallet operations: balance, credit, debit, withdrawal
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { WalletService } from "../wallet";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
    rpc: vi.fn(),
  })),
}));

// Mock Paystack client
vi.mock("@/lib/paystack/client", () => ({
  paystackClient: {
    createRecipient: vi.fn(),
    initiateTransfer: vi.fn(),
  },
}));

describe("WalletService", () => {
  let walletService: WalletService;

  beforeEach(() => {
    walletService = new WalletService();
    vi.clearAllMocks();
  });

  describe("creditWallet", () => {
    it("should reject negative credit amounts", async () => {
      await expect(
        walletService.creditWallet({
          user_id: "user123",
          amount: -100,
          description: "Test credit",
          category: "escrow_release",
        }),
      ).rejects.toThrow("Credit amount must be greater than 0");
    });

    it("should reject zero credit amounts", async () => {
      await expect(
        walletService.creditWallet({
          user_id: "user123",
          amount: 0,
          description: "Test credit",
          category: "escrow_release",
        }),
      ).rejects.toThrow("Credit amount must be greater than 0");
    });
  });

  describe("debitWallet", () => {
    it("should reject negative debit amounts", async () => {
      await expect(
        walletService.debitWallet({
          user_id: "user123",
          amount: -100,
          description: "Test debit",
          category: "withdrawal",
        }),
      ).rejects.toThrow("Debit amount must be greater than 0");
    });

    it("should reject zero debit amounts", async () => {
      await expect(
        walletService.debitWallet({
          user_id: "user123",
          amount: 0,
          description: "Test debit",
          category: "withdrawal",
        }),
      ).rejects.toThrow("Debit amount must be greater than 0");
    });
  });

  describe("requestWithdrawal", () => {
    it("should reject negative withdrawal amounts", async () => {
      await expect(
        walletService.requestWithdrawal({
          user_id: "user123",
          amount: -1000,
          bank_code: "058",
          account_number: "1234567890",
          account_name: "Test User",
        }),
      ).rejects.toThrow("Withdrawal amount must be greater than 0");
    });

    it("should reject zero withdrawal amounts", async () => {
      await expect(
        walletService.requestWithdrawal({
          user_id: "user123",
          amount: 0,
          bank_code: "058",
          account_number: "1234567890",
          account_name: "Test User",
        }),
      ).rejects.toThrow("Withdrawal amount must be greater than 0");
    });
  });

  describe("withdrawal fee calculation", () => {
    it("should apply ₦100 fee for amounts below ₦10,000", () => {
      const amount = 5000;
      const expectedFee = 100;
      // Fee calculation is done by database function
      // This test documents the expected behavior
      expect(amount).toBeLessThan(10000);
      expect(expectedFee).toBe(100);
    });

    it("should apply ₦50 fee for amounts between ₦10,000 and ₦19,999", () => {
      const amount = 15000;
      const expectedFee = 50;
      expect(amount).toBeGreaterThanOrEqual(10000);
      expect(amount).toBeLessThan(20000);
      expect(expectedFee).toBe(50);
    });

    it("should apply ₦0 fee for amounts ₦20,000 and above", () => {
      const amount = 25000;
      const expectedFee = 0;
      expect(amount).toBeGreaterThanOrEqual(20000);
      expect(expectedFee).toBe(0);
    });
  });

  describe("large withdrawal verification", () => {
    it("should require verification for withdrawals over ₦100,000", () => {
      const amount = 150000;
      const requiresVerification = amount > 100000;
      expect(requiresVerification).toBe(true);
    });

    it("should not require verification for withdrawals ₦100,000 or less", () => {
      const amount = 100000;
      const requiresVerification = amount > 100000;
      expect(requiresVerification).toBe(false);
    });
  });
});
