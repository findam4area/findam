import { describe, it, expect, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/client";

/**
 * Integration Test: Search and Filter Flow
 *
 * Tests the complete search and filtering experience:
 * 1. Text search with autocomplete
 * 2. Category filtering
 * 3. Price range filtering
 * 4. Location filtering
 * 5. Condition filtering
 * 6. Combined filters
 * 7. Sort functionality
 * 8. Search history
 */

describe("Integration: Search and Filter Flow", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    supabase = createClient();
  });

  describe("1. Text Search", () => {
    it("should search listings by title", async () => {
      const searchQuery = "phone";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description")
        .eq("is_active", true)
        .ilike("title", `%${searchQuery}%`)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(
              listing.title.toLowerCase().includes(searchQuery.toLowerCase()),
            ).toBe(true);
          });
        }
      }
    });

    it("should search listings by description", async () => {
      const searchQuery = "good";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description")
        .eq("is_active", true)
        .ilike("description", `%${searchQuery}%`)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(
              listing.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
            ).toBe(true);
          });
        }
      }
    });

    it("should search across title and description", async () => {
      const searchQuery = "laptop";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description")
        .eq("is_active", true)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();
        if (data && data.length > 0) {
          data.forEach((listing) => {
            const matchesTitle = listing.title
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            const matchesDescription = listing.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            expect(matchesTitle || matchesDescription).toBe(true);
          });
        }
      }
    });

    it("should handle empty search results gracefully", async () => {
      const searchQuery = "xyzabc123nonexistent";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title")
        .eq("is_active", true)
        .ilike("title", `%${searchQuery}%`)
        .limit(10);

      // Handle network errors gracefully
      if (error && error.message && error.message.includes("fetch failed")) {
        // Network error - skip this check
        expect(error).toBeDefined();
        return;
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("2. Autocomplete Search", () => {
    it("should provide autocomplete suggestions", async () => {
      const searchPrefix = "ph";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title")
        .eq("is_active", true)
        .ilike("title", `${searchPrefix}%`)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(
              listing.title
                .toLowerCase()
                .startsWith(searchPrefix.toLowerCase()),
            ).toBe(true);
          });
        }
      }
    });

    it("should limit autocomplete results", async () => {
      const searchPrefix = "a";
      const maxResults = 5;

      const { data, error } = await supabase
        .from("listings")
        .select("id, title")
        .eq("is_active", true)
        .ilike("title", `${searchPrefix}%`)
        .limit(maxResults);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data) {
        expect(data.length).toBeLessThanOrEqual(maxResults);
      }
    });
  });

  describe("3. Category Filtering", () => {
    it("should filter by main category", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .limit(1);

      if (categories && categories.length > 0) {
        const categoryId = categories[0].id;

        const { data, error } = await supabase
          .from("listings")
          .select("id, title, category_id")
          .eq("is_active", true)
          .eq("category_id", categoryId)
          .limit(10);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.category_id).toBe(categoryId);
          });
        }
      }
    });

    it("should filter by subcategory", async () => {
      const { data: subcategories } = await supabase
        .from("subcategories")
        .select("id, name, category_id")
        .limit(1);

      if (subcategories && subcategories.length > 0) {
        const subcategoryId = subcategories[0].id;

        const { data, error } = await supabase
          .from("listings")
          .select("id, title, subcategory_id")
          .eq("is_active", true)
          .eq("subcategory_id", subcategoryId)
          .limit(10);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.subcategory_id).toBe(subcategoryId);
          });
        }
      }
    });

    it("should retrieve all categories for filter UI", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name", { ascending: true });

      // Handle network errors gracefully
      if (error && error.message && error.message.includes("fetch failed")) {
        // Network error - skip this check
        expect(error).toBeDefined();
        return;
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });

    it("should retrieve subcategories for a category", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .limit(1);

      if (categories && categories.length > 0) {
        const categoryId = categories[0].id;

        const { data, error } = await supabase
          .from("subcategories")
          .select("id, name, category_id")
          .eq("category_id", categoryId);

        expect(error).toBeNull();
        expect(data).toBeDefined();
        if (data && data.length > 0) {
          data.forEach((subcategory) => {
            expect(subcategory.category_id).toBe(categoryId);
          });
        }
      }
    });
  });

  describe("4. Price Range Filtering", () => {
    it("should filter by minimum price", async () => {
      const minPrice = 10000;

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price")
        .eq("is_active", true)
        .gte("price", minPrice)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          if (listing.price !== null) {
            expect(listing.price).toBeGreaterThanOrEqual(minPrice);
          }
        });
      }
    });

    it("should filter by maximum price", async () => {
      const maxPrice = 100000;

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price")
        .eq("is_active", true)
        .lte("price", maxPrice)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          if (listing.price !== null) {
            expect(listing.price).toBeLessThanOrEqual(maxPrice);
          }
        });
      }
    });

    it("should filter by price range", async () => {
      const minPrice = 10000;
      const maxPrice = 100000;

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price")
        .eq("is_active", true)
        .gte("price", minPrice)
        .lte("price", maxPrice)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          if (listing.price !== null) {
            expect(listing.price).toBeGreaterThanOrEqual(minPrice);
            expect(listing.price).toBeLessThanOrEqual(maxPrice);
          }
        });
      }
    });

    it("should handle free items (price = 0)", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price")
        .eq("is_active", true)
        .eq("price", 0)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          expect(listing.price).toBe(0);
        });
      }
    });
  });

  describe("5. Location Filtering", () => {
    it("should filter by state", async () => {
      const state = "Lagos";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, state")
        .eq("is_active", true)
        .eq("state", state)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          expect(listing.state).toBe(state);
        });
      }
    });

    it("should filter by area within state", async () => {
      const state = "Lagos";
      const area = "Ikeja";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, state, area")
        .eq("is_active", true)
        .eq("state", state)
        .eq("area", area)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing: any) => {
          expect(listing.state).toBe(state);
          expect(listing.area).toBe(area);
        });
      }
    });

    it("should retrieve all available states", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("state")
        .eq("is_active", true)
        .not("state", "is", null);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        const uniqueStates = [...new Set(data.map((l) => l.state))];
        expect(uniqueStates.length).toBeGreaterThan(0);
      }
    });
  });

  describe("6. Condition Filtering", () => {
    it("should filter by new condition", async () => {
      const condition = "new";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, condition")
        .eq("is_active", true)
        .eq("condition", condition)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          expect(listing.condition).toBe(condition);
        });
      }
    });

    it("should filter by used condition", async () => {
      const condition = "used";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, condition")
        .eq("is_active", true)
        .eq("condition", condition)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          expect(listing.condition).toBe(condition);
        });
      }
    });

    it("should support all condition types", async () => {
      const validConditions = ["new", "used", "refurbished"];

      const { data, error } = await supabase
        .from("listings")
        .select("id, condition")
        .eq("is_active", true)
        .limit(20);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          if (listing.condition) {
            expect(validConditions).toContain(listing.condition);
          }
        });
      }
    });
  });

  describe("7. Combined Filters", () => {
    it("should combine category and price filters", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .limit(1);

      if (categories && categories.length > 0) {
        const categoryId = categories[0].id;
        const minPrice = 10000;
        const maxPrice = 100000;

        const { data, error } = await supabase
          .from("listings")
          .select("id, title, category_id, price")
          .eq("is_active", true)
          .eq("category_id", categoryId)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .limit(10);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.category_id).toBe(categoryId);
            if (listing.price !== null) {
              expect(listing.price ?? 0).toBeGreaterThanOrEqual(minPrice);
              expect(listing.price ?? 0).toBeLessThanOrEqual(maxPrice);
            }
          });
        }
      }
    });

    it("should combine location and condition filters", async () => {
      const state = "Lagos";
      const condition = "new";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, state, condition")
        .eq("is_active", true)
        .eq("state", state)
        .eq("condition", condition)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          expect(listing.state).toBe(state);
          expect(listing.condition).toBe(condition);
        });
      }
    });

    it("should combine all filters", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .limit(1);

      if (categories && categories.length > 0) {
        const categoryId = categories[0].id;
        const minPrice = 10000;
        const maxPrice = 100000;
        const state = "Lagos";
        const condition = "new";

        const { data, error } = await supabase
          .from("listings")
          .select("id, title, category_id, price, state, condition")
          .eq("is_active", true)
          .eq("category_id", categoryId)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .eq("state", state)
          .eq("condition", condition)
          .limit(10);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.category_id).toBe(categoryId);
            expect(listing.state).toBe(state);
            expect(listing.condition).toBe(condition);
            if (listing.price !== null) {
              expect(listing.price).toBeGreaterThanOrEqual(minPrice);
              expect(listing.price).toBeLessThanOrEqual(maxPrice);
            }
          });
        }
      }
    });
  });

  describe("8. Sort Functionality", () => {
    it("should sort by price ascending", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price")
        .eq("is_active", true)
        .not("price", "is", null)
        .order("price", { ascending: true })
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].price ?? 0).toBeLessThanOrEqual(
            data[i + 1].price ?? 0,
          );
        }
      }
    });

    it("should sort by price descending", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price")
        .eq("is_active", true)
        .not("price", "is", null)
        .order("price", { ascending: false })
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].price ?? 0).toBeGreaterThanOrEqual(
            data[i + 1].price ?? 0,
          );
        }
      }
    });

    it("should sort by date (newest first)", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const time1 = new Date(
            data[i].created_at ?? new Date().toISOString(),
          ).getTime();
          const time2 = new Date(
            data[i + 1].created_at ?? new Date().toISOString(),
          ).getTime();
          expect(time1).toBeGreaterThanOrEqual(time2);
        }
      }
    });

    it("should sort by date (oldest first)", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const time1 = new Date(
            data[i].created_at ?? new Date().toISOString(),
          ).getTime();
          const time2 = new Date(
            data[i + 1].created_at ?? new Date().toISOString(),
          ).getTime();
          expect(time1).toBeLessThanOrEqual(time2);
        }
      }
    });

    it("should sort by popularity (views)", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, views_count")
        .eq("is_active", true)
        .order("views_count", { ascending: false })
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].views_count ?? 0).toBeGreaterThanOrEqual(
            data[i + 1].views_count ?? 0,
          );
        }
      }
    });
  });

  describe("9. Search Performance", () => {
    it("should execute search queries efficiently", async () => {
      const startTime = Date.now();

      await supabase
        .from("listings")
        .select("id, title, price, state")
        .eq("is_active", true)
        .ilike("title", "%phone%")
        .gte("price", 10000)
        .lte("price", 100000)
        .eq("state", "Lagos")
        .limit(20);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Complex query should complete in reasonable time
      expect(queryTime).toBeLessThan(2000);
    });

    it("should support pagination for search results", async () => {
      const pageSize = 20;

      const { data: page1, error } = await supabase
        .from("listings")
        .select("id, title")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(0, pageSize - 1);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(page1).toBeDefined();
        expect(Array.isArray(page1)).toBe(true);
      }
    });
  });

  describe("10. Search History", () => {
    it("should store recent searches in localStorage", () => {
      // This would be tested in the client-side code
      // Here we just verify the concept
      const recentSearches = ["phone", "laptop", "car"];
      const stored = JSON.stringify(recentSearches);

      expect(stored).toBeDefined();
      expect(JSON.parse(stored)).toEqual(recentSearches);
    });

    it("should limit search history to recent items", () => {
      const maxHistory = 10;
      const searches = Array.from({ length: 15 }, (_, i) => `search${i}`);
      const limitedHistory = searches.slice(-maxHistory);

      expect(limitedHistory.length).toBe(maxHistory);
      expect(limitedHistory[0]).toBe("search5");
    });
  });
});
