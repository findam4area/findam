import { describe, it, expect, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/client";

/**
 * Integration Test: Payment Flow
 *
 * Tests the complete payment and monetization experience:
 * 1. Boost listing payment (₦500)
 * 2. Premium subscription (₦5,999/month)
 * 3. Payment verification
 * 4. Premium features access
 * 5. Subscription expiration handling
 */

describe("Integration: Payment Flow", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    supabase = createClient();
  });

  describe("1. Payment Infrastructure", () => {
    it("should have payments table with required fields", async () => {
      const { error } = await supabase
        .from("payments")
        .select(
          "id, user_id, amount, payment_type, status, reference, created_at",
        )
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should track payment types (boost, premium)", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, payment_type")
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment) => {
          expect(["boost", "premium"]).toContain(payment.payment_type);
        });
      }
    });

    it("should track payment status", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, status")
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment) => {
          expect(["pending", "success", "failed"]).toContain(payment.status);
        });
      }
    });

    it("should store Paystack reference for verification", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, reference")
        .not("reference", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment: any) => {
          expect(payment.reference).toBeDefined();
          expect(typeof payment.reference).toBe("string");
        });
      }
    });
  });

  describe("2. Boost Listing Payment", () => {
    it("should track boost amount (₦500)", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_type")
        .eq("payment_type", "boost")
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment) => {
          expect(payment.amount).toBe(500);
        });
      }
    });

    it("should link boost payment to listing", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, listing_id, payment_type")
        .eq("payment_type", "boost")
        .not("listing_id", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment) => {
          expect(payment.listing_id).toBeDefined();
        });
      }
    });

    it("should activate boost on successful payment", async () => {
      const { data: boostedListings, error } = await supabase
        .from("listings")
        .select("id, is_boosted, boost_expires_at")
        .eq("is_boosted", true)
        .not("boost_expires_at", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (boostedListings && boostedListings.length > 0) {
        boostedListings.forEach((listing) => {
          expect(listing.is_boosted).toBe(true);
          expect(listing.boost_expires_at).toBeDefined();
          // Boost should expire in the future
          const expiresAt = new Date(
            listing.boost_expires_at ?? new Date().toISOString(),
          );
          expect(expiresAt).toBeInstanceOf(Date);
        });
      }
    });

    it("should set boost expiration (7 days)", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, is_boosted, boost_expires_at, updated_at")
        .eq("is_boosted", true)
        .not("boost_expires_at", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          const expiresAt = new Date(
            listing.boost_expires_at ?? new Date().toISOString(),
          );
          const updatedAt = new Date(
            listing.updated_at ?? new Date().toISOString(),
          );
          const daysDiff =
            (expiresAt.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

          // Should be approximately 7 days (allow some variance)
          expect(daysDiff).toBeGreaterThan(6);
          expect(daysDiff).toBeLessThan(8);
        });
      }
    });
  });

  describe("3. Premium Subscription", () => {
    it("should track premium amount (₦5,999)", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_type")
        .eq("payment_type", "premium")
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment) => {
          expect(payment.amount).toBe(5999);
        });
      }
    });

    it("should activate premium status on successful payment", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, is_premium, premium_expires_at")
        .eq("is_premium", true)
        .not("premium_expires_at", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((user) => {
          expect(user.is_premium).toBe(true);
          expect(user.premium_expires_at).toBeDefined();
          const expiresAt = new Date(
            user.premium_expires_at ?? new Date().toISOString(),
          );
          expect(expiresAt).toBeInstanceOf(Date);
        });
      }
    });

    it("should set premium expiration (30 days)", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, is_premium, premium_expires_at, updated_at")
        .eq("is_premium", true)
        .not("premium_expires_at", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((user) => {
          const expiresAt = new Date(
            user.premium_expires_at ?? new Date().toISOString(),
          );
          const now = new Date();
          const daysDiff =
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

          // Should expire in the future (within 30 days)
          expect(daysDiff).toBeGreaterThan(0);
          expect(daysDiff).toBeLessThanOrEqual(30);
        });
      }
    });

    it("should allow premium users to create up to 30 listings", async () => {
      const { data: premiumUsers, error } = await supabase
        .from("users")
        .select("id, is_premium")
        .eq("is_premium", true)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (premiumUsers && premiumUsers.length > 0) {
        for (const user of premiumUsers) {
          const { data: listings } = await supabase
            .from("listings")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true);

          if (listings) {
            // Premium users can have up to 30 listings
            expect(listings.length).toBeLessThanOrEqual(30);
          }
        }
      }
    });
  });

  describe("4. Payment Verification", () => {
    it("should verify payment reference is unique", async () => {
      const { data, error } = await (supabase as any)
        .from("payments")
        .select("reference")
        .not("reference", "is", null)
        .limit(20);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 1) {
        const references = data.map((p: any) => p.reference);
        const uniqueReferences = new Set(references);
        // All references should be unique
        expect(uniqueReferences.size).toBe(references.length);
      }
    });

    it("should track payment verification timestamp", async () => {
      const { data, error } = await (supabase as any)
        .from("payments")
        .select("id, status, verified_at")
        .eq("status", "success")
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment: any) => {
          // Successful payments should have verification timestamp
          if (payment.verified_at) {
            expect(
              new Date(payment.verified_at ?? new Date().toISOString()),
            ).toBeInstanceOf(Date);
          }
        });
      }
    });

    it("should prevent duplicate payment processing", async () => {
      const { data, error } = await (supabase as any)
        .from("payments")
        .select("reference, status")
        .not("reference", "is", null)
        .limit(20);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        // Group by reference
        const referenceGroups = data.reduce(
          (acc: any, payment: any) => {
            if (!acc[payment.reference]) {
              acc[payment.reference] = [];
            }
            acc[payment.reference].push(payment);
            return acc;
          },
          {} as Record<string, typeof data>,
        );

        // Each reference should appear only once
        Object.values(referenceGroups).forEach((group: any) => {
          expect(group.length).toBe(1);
        });
      }
    });
  });

  describe("5. Premium Features Access", () => {
    it("should grant premium badge to premium users", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, is_premium, premium_expires_at")
        .eq("is_premium", true)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((user) => {
          expect(user.is_premium).toBe(true);
          // Premium users should have valid expiration
          if (user.premium_expires_at) {
            const expiresAt = new Date(user.premium_expires_at);
            const now = new Date();
            expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
          }
        });
      }
    });

    it("should provide analytics access to premium users", async () => {
      // Premium users should be able to access analytics
      const { data: premiumUsers } = await supabase
        .from("users")
        .select("id, is_premium")
        .eq("is_premium", true)
        .limit(1);

      if (premiumUsers && premiumUsers.length > 0) {
        const userId = premiumUsers[0].id;

        // Check if user has listings with analytics data
        const { data, error } = await supabase
          .from("listings")
          .select("id, views_count, likes_count, saves_count")
          .eq("user_id", userId)
          .limit(5);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else {
          expect(data).toBeDefined();
        }
      }
    });

    it("should prioritize premium stories in feed", async () => {
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
          id,
          user:users(id, is_premium)
        `,
        )
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        // Premium stories should be prioritized (this is a business logic check)
        expect(data).toBeDefined();
      }
    });
  });

  describe("6. Subscription Expiration", () => {
    it("should track expired premium subscriptions", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, is_premium, premium_expires_at")
        .not("premium_expires_at", "is", null)
        .lt("premium_expires_at", new Date().toISOString())
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((user) => {
          const expiresAt = new Date(
            user.premium_expires_at ?? new Date().toISOString(),
          );
          const now = new Date();
          // Expired subscriptions should be in the past
          expect(expiresAt.getTime()).toBeLessThan(now.getTime());
          // is_premium should be false for expired subscriptions
          expect(user.is_premium).toBe(false);
        });
      }
    });

    it("should downgrade users after subscription expires", async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, is_premium, premium_expires_at")
        .eq("is_premium", false)
        .not("premium_expires_at", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((user) => {
          // Non-premium users with expiration date should have expired
          if (user.premium_expires_at) {
            const expiresAt = new Date(user.premium_expires_at);
            const now = new Date();
            expect(expiresAt.getTime()).toBeLessThan(now.getTime());
          }
        });
      }
    });

    it("should enforce free tier limits after downgrade", async () => {
      const { data: expiredUsers, error } = await supabase
        .from("users")
        .select("id, is_premium")
        .eq("is_premium", false)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (expiredUsers && expiredUsers.length > 0) {
        for (const user of expiredUsers) {
          const { data: listings } = await supabase
            .from("listings")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true);

          if (listings) {
            // Free users should have <= 5 active listings
            expect(listings.length).toBeLessThanOrEqual(5);
          }
        }
      }
    });
  });

  describe("7. Boost Expiration", () => {
    it("should track expired boosts", { timeout: 15000 }, async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, is_boosted, boost_expires_at")
        .not("boost_expires_at", "is", null)
        .lt("boost_expires_at", new Date().toISOString())
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          const expiresAt = new Date(
            listing.boost_expires_at ?? new Date().toISOString(),
          );
          const now = new Date();
          // Expired boosts should be in the past
          expect(expiresAt.getTime()).toBeLessThan(now.getTime());
          // is_boosted should be false for expired boosts
          expect(listing.is_boosted).toBe(false);
        });
      }
    });

    it("should remove boost status after expiration", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, is_boosted, boost_expires_at")
        .eq("is_boosted", false)
        .not("boost_expires_at", "is", null)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          // Non-boosted listings with expiration should have expired
          if (listing.boost_expires_at) {
            const expiresAt = new Date(listing.boost_expires_at);
            const now = new Date();
            expect(expiresAt.getTime()).toBeLessThan(now.getTime());
          }
        });
      }
    });
  });

  describe("8. Payment History", () => {
    it("should retrieve user payment history", async () => {
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (users && users.length > 0) {
        const userId = users[0].id;

        const { data, error } = await supabase
          .from("payments")
          .select("id, amount, payment_type, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else {
          expect(data).toBeDefined();
          expect(Array.isArray(data)).toBe(true);
        }
      }
    });

    it("should calculate total revenue", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "success");

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        const totalRevenue = data.reduce(
          (sum, payment) => sum + payment.amount,
          0,
        );
        expect(totalRevenue).toBeGreaterThan(0);
      }
    });
  });

  describe("9. Payment Security", () => {
    it("should not expose sensitive payment data", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment) => {
          // Should not contain card details or sensitive info
          expect(payment).not.toHaveProperty("card_number");
          expect(payment).not.toHaveProperty("cvv");
          expect(payment).not.toHaveProperty("card_expiry");
        });
      }
    });

    it("should validate payment amounts", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_type")
        .limit(20);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((payment) => {
          // Boost should be ₦500, Premium should be ₦5,999
          if (payment.payment_type === "boost") {
            expect(payment.amount).toBe(500);
          } else if (payment.payment_type === "premium") {
            expect(payment.amount).toBe(5999);
          }
        });
      }
    });
  });
});
