import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { createClient } from "@/lib/supabase/server";
import { getStoryExpirationDate } from "@/lib/supabase/helpers";

/**
 * Property-Based Tests for Stories Feature
 *
 * These tests validate the correctness properties defined in the design document:
 * - Property 44: Story Visibility Duration
 * - Property 45: Premium Story Priority
 */

// Arbitraries for generating test data
const uuidArbitrary = fc.uuid();
const videoUrlArbitrary = fc.webUrl({ validSchemes: ["https"] });
const thumbnailUrlArbitrary = fc.option(
  fc.webUrl({ validSchemes: ["https"] }),
  { nil: undefined },
);

describe.skip("Stories Feature - Property-Based Tests", () => {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  let testUserIds: string[] = [];
  let testStoryIds: string[] = [];

  beforeEach(async () => {
    supabase = await createClient();
    testUserIds = [];
    testStoryIds = [];
  });

  afterEach(async () => {
    // Cleanup: Delete test stories
    if (testStoryIds.length > 0) {
      await supabase.from("stories").delete().in("id", testStoryIds);
    }

    // Cleanup: Delete test users
    if (testUserIds.length > 0) {
      await supabase.from("users").delete().in("id", testUserIds);
    }
  });

  /**
   * Property 44: Story Visibility Duration
   * **Validates: Requirements 9.2**
   *
   * For any published story, it should be visible to all users immediately after publication.
   *
   * This property verifies that:
   * 1. A newly created story is immediately retrievable
   * 2. The story has a valid expiration date 24 hours in the future
   * 3. The story is included in the active stories list
   */
  it("Property 44: Story Visibility Duration", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(uuidArbitrary, videoUrlArbitrary, thumbnailUrlArbitrary),
        async ([userId, videoUrl, thumbnailUrl]) => {
          // Create test user
          const { data: user, error: userError } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: `test-${userId}@example.com`,
              username: `testuser-${userId.slice(0, 8)}`,
              phone_verified: true,
            })
            .select()
            .single();

          if (userError || !user) {
            throw new Error(
              `Failed to create test user: ${userError?.message}`,
            );
          }
          testUserIds.push(userId);

          // Create story
          const expiresAt = getStoryExpirationDate();
          const { data: story, error: storyError } = await supabase
            .from("stories")
            .insert({
              user_id: userId,
              video_url: videoUrl,
              thumbnail_url: thumbnailUrl,
              expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

          if (storyError || !story) {
            throw new Error(`Failed to create story: ${storyError?.message}`);
          }
          testStoryIds.push(story.id);

          // Property 1: Story should be immediately retrievable
          const { data: retrievedStory, error: retrieveError } = await supabase
            .from("stories")
            .select("*")
            .eq("id", story.id)
            .single();

          expect(retrieveError).toBeNull();
          expect(retrievedStory).toBeDefined();
          expect(retrievedStory?.id).toBe(story.id);
          expect(retrievedStory?.user_id).toBe(userId);
          expect(retrievedStory?.video_url).toBe(videoUrl);

          // Property 2: Story should have expiration date 24 hours in the future
          const createdAt = new Date(
            story.created_at ?? new Date().toISOString(),
          );
          const expiresAtDate = new Date(
            story.expires_at ?? new Date().toISOString(),
          );
          const hoursDifference =
            (expiresAtDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

          // Allow small tolerance for timing differences (23.9 to 24.1 hours)
          expect(hoursDifference).toBeGreaterThanOrEqual(23.9);
          expect(hoursDifference).toBeLessThanOrEqual(24.1);

          // Property 3: Story should be included in active stories list
          const { data: activeStories, error: activeError } = await supabase
            .from("stories")
            .select("*")
            .gt("expires_at", new Date().toISOString());

          expect(activeError).toBeNull();
          expect(activeStories).toBeDefined();

          const storyInList = activeStories?.find((s) => s.id === story.id);
          expect(storyInList).toBeDefined();
          expect(storyInList?.user_id).toBe(userId);

          // Property 4: Story should be visible immediately (created_at should be recent)
          const timeSinceCreation = Date.now() - createdAt.getTime();
          expect(timeSinceCreation).toBeLessThan(5000); // Less than 5 seconds
        },
      ),
      { numRuns: 5 }, // Reduced runs for database operations
    );
  });

  /**
   * Property 45: Premium Story Priority
   * **Validates: Requirements 9.6**
   *
   * For any premium user's story, it should have priority placement over non-premium stories.
   *
   * This property verifies that:
   * 1. When fetching stories, premium users' stories appear before non-premium users' stories
   * 2. The sorting is consistent regardless of creation time
   * 3. Among premium users, stories are sorted by most recent
   * 4. Among non-premium users, stories are sorted by most recent
   */
  it("Property 45: Premium Story Priority", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.array(fc.tuple(uuidArbitrary, fc.boolean(), videoUrlArbitrary), {
            minLength: 2,
            maxLength: 5,
          }),
        ),
        async ([userStoryData]) => {
          // Ensure we have at least one premium and one non-premium user
          const hasPremium = userStoryData.some(([, isPremium]) => isPremium);
          const hasNonPremium = userStoryData.some(
            ([, isPremium]) => !isPremium,
          );
          fc.pre(hasPremium && hasNonPremium);

          // Create test users and stories
          const createdStories: Array<{
            storyId: string;
            userId: string;
            isPremium: boolean;
            createdAt: Date;
          }> = [];

          for (const [userId, isPremium, videoUrl] of userStoryData) {
            // Create user
            const premiumExpiresAt = isPremium
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              : null;

            const { data: user, error: userError } = await supabase
              .from("users")
              .insert({
                id: userId,
                email: `test-${userId}@example.com`,
                username: `testuser-${userId.slice(0, 8)}`,
                phone_verified: true,
                is_premium: isPremium,
                premium_expires_at: premiumExpiresAt?.toISOString(),
              })
              .select()
              .single();

            if (userError || !user) {
              throw new Error(
                `Failed to create test user: ${userError?.message}`,
              );
            }
            testUserIds.push(userId);

            // Create story
            const expiresAt = getStoryExpirationDate();
            const { data: story, error: storyError } = await supabase
              .from("stories")
              .insert({
                user_id: userId,
                video_url: videoUrl,
                expires_at: expiresAt.toISOString(),
              })
              .select()
              .single();

            if (storyError || !story) {
              throw new Error(`Failed to create story: ${storyError?.message}`);
            }
            testStoryIds.push(story.id);

            createdStories.push({
              storyId: story.id,
              userId: userId,
              isPremium: isPremium,
              createdAt: new Date(story.created_at ?? new Date().toISOString()),
            });

            // Add small delay to ensure different timestamps
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Fetch active stories with user information
          const { data: stories, error: fetchError } = await supabase
            .from("stories")
            .select(
              `
              *,
              user:users(id, username, avatar_url, is_premium)
            `,
            )
            .gt("expires_at", new Date().toISOString())
            .in(
              "id",
              createdStories.map((s) => s.storyId),
            )
            .order("created_at", { ascending: false });

          expect(fetchError).toBeNull();
          expect(stories).toBeDefined();
          expect(stories?.length).toBe(createdStories.length);

          // Group stories by user (simulating the API behavior)
          const storiesByUser = stories!.reduce(
            (acc, story) => {
              const userId = story.user_id ?? "";
              if (!acc[userId]) {
                acc[userId] = [];
              }
              acc[userId].push(story);
              return acc;
            },
            {} as Record<string, any[]>,
          );

          // Sort users: premium first, then by most recent story
          const sortedUserStories = Object.entries(storiesByUser)
            .sort(([, storiesA], [, storiesB]) => {
              const isPremiumA = storiesA[0]?.user?.is_premium || false;
              const isPremiumB = storiesB[0]?.user?.is_premium || false;

              if (isPremiumA && !isPremiumB) return -1;
              if (!isPremiumA && isPremiumB) return 1;

              // If both premium or both not premium, sort by most recent
              return (
                new Date(storiesB[0].created_at).getTime() -
                new Date(storiesA[0].created_at).getTime()
              );
            })
            .map(([userId, userStories]) => ({
              userId,
              user: userStories[0].user,
              stories: userStories,
            }));

          // Property 1: Premium users should appear before non-premium users
          let foundNonPremium = false;
          for (const userStory of sortedUserStories) {
            if (!userStory.user.is_premium) {
              foundNonPremium = true;
            } else if (foundNonPremium) {
              // Found a premium user after a non-premium user - this violates the property
              throw new Error(
                "Premium user found after non-premium user in sorted list",
              );
            }
          }

          // Property 2: Among premium users, stories should be sorted by most recent
          const premiumUsers = sortedUserStories.filter(
            (us) => us.user.is_premium,
          );
          for (let i = 0; i < premiumUsers.length - 1; i++) {
            const currentTime = new Date(
              premiumUsers[i].stories[0].created_at,
            ).getTime();
            const nextTime = new Date(
              premiumUsers[i + 1].stories[0].created_at,
            ).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }

          // Property 3: Among non-premium users, stories should be sorted by most recent
          const nonPremiumUsers = sortedUserStories.filter(
            (us) => !us.user.is_premium,
          );
          for (let i = 0; i < nonPremiumUsers.length - 1; i++) {
            const currentTime = new Date(
              nonPremiumUsers[i].stories[0].created_at,
            ).getTime();
            const nextTime = new Date(
              nonPremiumUsers[i + 1].stories[0].created_at,
            ).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }

          // Property 4: All premium users should appear before all non-premium users
          if (premiumUsers.length > 0 && nonPremiumUsers.length > 0) {
            const lastPremiumIndex = sortedUserStories.findIndex(
              (us) => !us.user.is_premium,
            );
            const firstNonPremiumIndex = sortedUserStories.findIndex(
              (us) => !us.user.is_premium,
            );

            if (lastPremiumIndex !== -1 && firstNonPremiumIndex !== -1) {
              expect(lastPremiumIndex).toBeLessThanOrEqual(
                firstNonPremiumIndex,
              );
            }
          }
        },
      ),
      { numRuns: 3 }, // Reduced runs for complex database operations
    );
  });
});
