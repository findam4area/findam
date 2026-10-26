import { describe, it, expect, beforeEach } from "vitest";
import { useListingsStore } from "../listings";
import type { Listing } from "@/lib/types";

describe("Listings Store", () => {
  beforeEach(() => {
    useListingsStore.getState().reset();
  });

  it("should initialize with empty listings", () => {
    const { listings } = useListingsStore.getState();
    expect(listings).toEqual([]);
  });

  it("should set listings correctly", () => {
    const mockListings: Listing[] = [
      {
        id: "1",
        user_id: "user1",
        title: "Test Listing",
        description: "Test description",
        price: 1000,
        category_id: "cat1",
        subcategory_id: "subcat1",
        state: "Lagos",
        lga: "Ikeja",
        is_boosted: false,
        is_active: true,
        views_count: 0,
        likes_count: 0,
        saves_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    useListingsStore.getState().setListings(mockListings);
    const { listings } = useListingsStore.getState();

    expect(listings).toEqual(mockListings);
  });

  it("should add listings correctly", () => {
    const listing1: Listing = {
      id: "1",
      user_id: "user1",
      title: "Listing 1",
      description: "Description 1",
      category_id: "cat1",
      subcategory_id: "subcat1",
      state: "Lagos",
      lga: "Ikeja",
      is_boosted: false,
      is_active: true,
      views_count: 0,
      likes_count: 0,
      saves_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const listing2: Listing = {
      id: "2",
      user_id: "user2",
      title: "Listing 2",
      description: "Description 2",
      category_id: "cat1",
      subcategory_id: "subcat1",
      state: "Abuja",
      lga: "Gwagwalada",
      is_boosted: false,
      is_active: true,
      views_count: 0,
      likes_count: 0,
      saves_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    useListingsStore.getState().setListings([listing1]);
    useListingsStore.getState().addListings([listing2]);

    const { listings } = useListingsStore.getState();
    expect(listings).toHaveLength(2);
    expect(listings[0].id).toBe("1");
    expect(listings[1].id).toBe("2");
  });

  it("should set filters correctly", () => {
    useListingsStore
      .getState()
      .setFilters({ category_id: "cat1", min_price: 100 });

    const { filters } = useListingsStore.getState();
    expect(filters.category_id).toBe("cat1");
    expect(filters.min_price).toBe(100);
  });

  it("should reset filters correctly", () => {
    useListingsStore
      .getState()
      .setFilters({ category_id: "cat1", min_price: 100 });
    useListingsStore.getState().resetFilters();

    const { filters } = useListingsStore.getState();
    expect(filters.category_id).toBeUndefined();
    expect(filters.min_price).toBeUndefined();
    expect(filters.sort_by).toBe("date_desc");
  });

  it("should manage pagination correctly", () => {
    expect(useListingsStore.getState().page).toBe(0);

    useListingsStore.getState().incrementPage();
    expect(useListingsStore.getState().page).toBe(1);

    useListingsStore.getState().setPage(5);
    expect(useListingsStore.getState().page).toBe(5);
  });
});
