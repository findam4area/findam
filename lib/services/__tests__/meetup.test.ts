/**
 * Meetup Service Tests
 * Property 68: Safe Meetup Location Suggestions
 * Property 69: Meetup Notification
 * Property 70: Meetup Completion Prompt
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Meetup Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 68: Safe Meetup Location Suggestions", () => {
    it("should always suggest safe locations between buyer and seller", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            buyerLat: fc.double({ min: -90, max: 90 }),
            buyerLng: fc.double({ min: -180, max: 180 }),
            sellerLat: fc.double({ min: -90, max: 90 }),
            sellerLng: fc.double({ min: -180, max: 180 }),
          }),
          async ({ buyerLat, buyerLng, sellerLat, sellerLng }) => {
            const { MeetupService } = await import("@/lib/services/meetup");

            const locations = await MeetupService.getSafeLocations(
              buyerLat,
              buyerLng,
              sellerLat,
              sellerLng,
            );

            // Property: Must return array of safe locations
            expect(Array.isArray(locations)).toBe(true);

            // Property: Each location must have required fields
            locations.forEach((location) => {
              expect(location).toHaveProperty("id");
              expect(location).toHaveProperty("name");
              expect(location).toHaveProperty("type");
              expect(location).toHaveProperty("address");
              expect(location).toHaveProperty("latitude");
              expect(location).toHaveProperty("longitude");
              expect(location).toHaveProperty("distance_from_buyer");
              expect(location).toHaveProperty("distance_from_seller");

              // Property: Type must be one of the safe location types
              expect([
                "police_station",
                "bank",
                "shopping_mall",
                "public_space",
              ]).toContain(location.type);

              // Property: Distances must be non-negative
              expect(location.distance_from_buyer).toBeGreaterThanOrEqual(0);
              expect(location.distance_from_seller).toBeGreaterThanOrEqual(0);
            });

            // Property: Locations should be sorted by average distance
            for (let i = 0; i < locations.length - 1; i++) {
              const avgDistCurrent =
                ((locations[i].distance_from_buyer || 0) +
                  (locations[i].distance_from_seller || 0)) /
                2;
              const avgDistNext =
                ((locations[i + 1].distance_from_buyer || 0) +
                  (locations[i + 1].distance_from_seller || 0)) /
                2;
              expect(avgDistCurrent).toBeLessThanOrEqual(avgDistNext);
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe("Property 69: Meetup Notification", () => {
    it("should send notifications to both parties when meetup is scheduled", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            meetupId: fc.uuid(),
            buyerId: fc.uuid(),
            sellerId: fc.uuid(),
            transactionId: fc.uuid(),
            scheduledTime: fc.date({
              min: new Date(),
              max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }),
          }),
          async ({
            meetupId,
            buyerId,
            sellerId,
            transactionId,
            scheduledTime,
          }) => {
            const notifications: any[] = [];

            // Mock meetup query
            const mockMeetupQuery = {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: meetupId,
                  transaction_id: transactionId,
                  buyer_id: buyerId,
                  seller_id: sellerId,
                  location_name: "Test Location",
                  location_address: "Test Address",
                  location_latitude: 6.5,
                  location_longitude: 3.5,
                  scheduled_time: scheduledTime.toISOString(),
                  status: "scheduled",
                  buyer_checked_in: false,
                  seller_checked_in: false,
                  safety_tips_acknowledged: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            };

            // Mock notification query
            const mockNotificationQuery = {
              insert: vi.fn((data) => {
                if (Array.isArray(data)) {
                  notifications.push(...data);
                } else {
                  notifications.push(data);
                }
                return Promise.resolve({ data: null, error: null });
              }),
            };

            // Mock select query for notifications
            const mockSelectQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: meetupId,
                  buyer_id: buyerId,
                  seller_id: sellerId,
                  scheduled_time: scheduledTime.toISOString(),
                  location_name: "Test Location",
                },
                error: null,
              }),
            };

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === "meetups") {
                return { ...mockMeetupQuery, ...mockSelectQuery };
              }
              if (table === "notifications") return mockNotificationQuery;
              return mockMeetupQuery;
            });

            const { MeetupService } = await import("@/lib/services/meetup");

            await MeetupService.scheduleMeetup({
              transaction_id: transactionId,
              buyer_id: buyerId,
              seller_id: sellerId,
              location_name: "Test Location",
              location_address: "Test Address",
              location_latitude: 6.5,
              location_longitude: 3.5,
              scheduled_time: scheduledTime,
            });

            // Property: Must send notifications to both buyer and seller
            expect(notifications.length).toBeGreaterThanOrEqual(2);

            const buyerNotification = notifications.find(
              (n) => n.user_id === buyerId,
            );
            const sellerNotification = notifications.find(
              (n) => n.user_id === sellerId,
            );

            expect(buyerNotification).toBeDefined();
            expect(sellerNotification).toBeDefined();

            // Property: Notifications must have required fields
            [buyerNotification, sellerNotification].forEach((notification) => {
              expect(notification.type).toBe("meetup_update");
              expect(notification.title).toBeDefined();
              expect(notification.message).toBeDefined();
              expect(notification.related_id).toBe(meetupId);
            });
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe("Property 70: Meetup Completion Prompt", () => {
    it.skip("should prompt for completion when both parties check in", async () => {
      const meetupId = "test-meetup-id";
      const buyerId = "test-buyer-id";
      const sellerId = "test-seller-id";
      const notifications: any[] = [];

      // Mock check-in update
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: meetupId,
            buyer_id: buyerId,
            seller_id: sellerId,
            buyer_checked_in: true,
            seller_checked_in: true,
            buyer_checked_in_at: new Date().toISOString(),
            seller_checked_in_at: new Date().toISOString(),
            scheduled_time: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      // Mock notification insert
      const mockNotificationQuery = {
        insert: vi.fn((data) => {
          if (Array.isArray(data)) {
            notifications.push(...data);
          } else {
            notifications.push(data);
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      // Mock select for completion prompt
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: meetupId,
            buyer_id: buyerId,
            seller_id: sellerId,
          },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "meetups") {
          return { ...mockUpdateQuery, ...mockSelectQuery };
        }
        if (table === "notifications") return mockNotificationQuery;
        return mockUpdateQuery;
      });

      const { MeetupService } = await import("@/lib/services/meetup");

      const result = await MeetupService.checkIn(meetupId, buyerId, "buyer");

      // Property: When both checked in, must return true
      expect(result.bothCheckedIn).toBe(true);
      expect(result.meetup).toBeDefined();

      // Property: Must send completion prompts to both parties
      expect(notifications.length).toBeGreaterThanOrEqual(2);

      const buyerPrompt = notifications.find((n) => n.user_id === buyerId);
      const sellerPrompt = notifications.find((n) => n.user_id === sellerId);

      expect(buyerPrompt).toBeDefined();
      expect(sellerPrompt).toBeDefined();

      // Property: Prompts must be for transaction completion
      [buyerPrompt, sellerPrompt].forEach((prompt) => {
        expect(prompt.type).toBe("transaction_completion");
        expect(prompt.title).toContain("transaction");
        expect(prompt.message).toContain("checked in");
      });
    });

    it("should not prompt for completion when only one party checks in", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            meetupId: fc.uuid(),
            buyerId: fc.uuid(),
            sellerId: fc.uuid(),
            userType: fc.constantFrom("buyer", "seller"),
          }),
          async ({ meetupId, buyerId, sellerId, userType }) => {
            const notifications: any[] = [];

            // Mock check-in update (only one party checked in)
            const mockUpdateQuery = {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: meetupId,
                  buyer_id: buyerId,
                  seller_id: sellerId,
                  buyer_checked_in: userType === "buyer",
                  seller_checked_in: userType === "seller",
                  buyer_checked_in_at:
                    userType === "buyer" ? new Date().toISOString() : undefined,
                  seller_checked_in_at:
                    userType === "seller"
                      ? new Date().toISOString()
                      : undefined,
                  scheduled_time: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            };

            const mockNotificationQuery = {
              insert: vi.fn((data) => {
                if (Array.isArray(data)) {
                  notifications.push(...data);
                } else {
                  notifications.push(data);
                }
                return Promise.resolve({ data: null, error: null });
              }),
            };

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === "meetups") return mockUpdateQuery;
              if (table === "notifications") return mockNotificationQuery;
              return mockUpdateQuery;
            });

            const { MeetupService } = await import("@/lib/services/meetup");

            const result = await MeetupService.checkIn(
              meetupId,
              userType === "buyer" ? buyerId : sellerId,
              userType as "buyer" | "seller",
            );

            // Property: When only one checked in, must return false
            expect(result.bothCheckedIn).toBe(false);

            // Property: Should not send completion prompts
            const completionPrompts = notifications.filter(
              (n) => n.type === "transaction_completion",
            );
            expect(completionPrompts.length).toBe(0);
          },
        ),
        { numRuns: 10 },
      );
    });
  });
});
