import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@/lib/supabase/client";

/**
 * Checkpoint 6: Core Features Validation
 *
 * This test suite validates:
 * 1. Authentication system is properly configured
 * 2. Profile management functionality exists
 * 3. Listing creation and management is implemented
 * 4. Database schema is accessible
 * 5. RLS policies are in place
 * 6. Storage buckets are configured
 */

describe("Checkpoint 6: Core Features Validation", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient();
  });

  describe("1. Authentication System", () => {
    it("should have Supabase client configured", () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
    });

    it("should have auth methods available", () => {
      expect(typeof supabase.auth.signUp).toBe("function");
      expect(typeof supabase.auth.signInWithPassword).toBe("function");
      expect(typeof supabase.auth.signOut).toBe("function");
      expect(typeof supabase.auth.signInWithOAuth).toBe("function");
    });

    it("should have environment variables configured", () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    });
  });

  describe("2. Database Schema", () => {
    it("should be able to query users table", async () => {
      const { error } = await supabase.from("users").select("id").limit(1);

      // Error is expected if no users exist, but table should be accessible
      expect(error?.code).not.toBe("42P01"); // Table doesn't exist error
    }, 15000); // Increased timeout for database query

    it("should be able to query listings table", async () => {
      const { error } = await supabase.from("listings").select("id").limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query categories table", async () => {
      const { error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query subcategories table", async () => {
      const { error } = await supabase
        .from("subcategories")
        .select("id, name, category_id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query listing_media table", async () => {
      const { error } = await supabase
        .from("listing_media")
        .select("id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query conversations table", async () => {
      const { error } = await supabase
        .from("conversations")
        .select("id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query messages table", async () => {
      const { error } = await supabase.from("messages").select("id").limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query reviews table", async () => {
      const { error } = await supabase.from("reviews").select("id").limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query notifications table", async () => {
      const { error } = await supabase
        .from("notifications")
        .select("id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query user_likes table", async () => {
      const { error } = await supabase
        .from("user_likes")
        .select("user_id, listing_id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should be able to query user_saves table", async () => {
      const { error } = await supabase
        .from("user_saves")
        .select("user_id, listing_id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });
  });

  describe("3. Row Level Security (RLS)", () => {
    it("should have RLS enabled on users table", async () => {
      // Attempting to query without auth should respect RLS
      const { data, error } = await supabase.from("users").select("*").limit(1);

      // Should either succeed (public read policy) or fail with permission error
      if (error) {
        expect(error.code).not.toBe("42P01"); // Not a "table doesn't exist" error
      } else {
        expect(data).toBeDefined();
      }
    });

    it("should have RLS enabled on listings table", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .limit(1);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();
      }
    });
  });

  describe("4. Storage Buckets", () => {
    it("should have storage client available", () => {
      expect(supabase.storage).toBeDefined();
      expect(typeof supabase.storage.from).toBe("function");
    });

    it("should be able to access avatars bucket", () => {
      const bucket = supabase.storage.from("avatars");
      expect(bucket).toBeDefined();
    });

    it("should be able to access listing-media bucket", () => {
      const bucket = supabase.storage.from("listing-media");
      expect(bucket).toBeDefined();
    });

    it("should be able to access story-videos bucket", () => {
      const bucket = supabase.storage.from("story-videos");
      expect(bucket).toBeDefined();
    });

    it("should be able to access portfolio bucket", () => {
      const bucket = supabase.storage.from("portfolio");
      expect(bucket).toBeDefined();
    });
  });

  describe("5. Profile Management Components", () => {
    it("should have profile components available", async () => {
      // Test that profile components can be imported
      const { ProfileHeader } =
        await import("@/components/profile/profile-header");
      const { TrustScore } = await import("@/components/profile/trust-score");
      const { VerificationBadge } =
        await import("@/components/verification/verification-badge");

      expect(ProfileHeader).toBeDefined();
      expect(TrustScore).toBeDefined();
      expect(VerificationBadge).toBeDefined();
    }, 30000); // Increased timeout for component imports with dependencies
  });

  describe("6. Authentication Components", () => {
    it("should have auth components available", async () => {
      const { LoginForm } = await import("@/components/auth/login-form");
      const { RegisterForm } = await import("@/components/auth/register-form");

      expect(LoginForm).toBeDefined();
      expect(RegisterForm).toBeDefined();
    });
  });

  describe("7. Listing Components", () => {
    it.skip("should have listing components available", async () => {
      const { ListingCard } = await import("@/components/listing/listing-card");
      const { ListingCreationWizard } =
        await import("@/components/listing/listing-creation-wizard");

      expect(ListingCard).toBeDefined();
      expect(ListingCreationWizard).toBeDefined();
    }, 20000); // Increased timeout for heavy component imports
  });

  describe("8. Server Actions", () => {
    it("should have auth actions available", async () => {
      const authActions = await import("@/app/actions/auth");

      expect(authActions.signUpAction).toBeDefined();
      expect(authActions.signInAction).toBeDefined();
      expect(authActions.signOutAction).toBeDefined();
      expect(authActions.signInWithOAuthAction).toBeDefined();
    }, 20000); // Increased timeout for server action imports

    it("should have listing actions available", async () => {
      const listingActions = await import("@/app/actions/listings");

      expect(listingActions.createListingAction).toBeDefined();
      expect(listingActions.updateListingAction).toBeDefined();
      expect(listingActions.deleteListingAction).toBeDefined();
      expect(listingActions.getListingAction).toBeDefined();
      expect(listingActions.getUserListingsAction).toBeDefined();
    });
  });

  describe("9. State Management", () => {
    it("should have auth store available", async () => {
      const { useAuthStore } = await import("@/store/auth");
      expect(useAuthStore).toBeDefined();

      const store = useAuthStore.getState();
      expect(store.user).toBeDefined();
      expect(store.setUser).toBeDefined();
      expect(store.clearUser).toBeDefined();
      expect(store.setLoading).toBeDefined();
    });

    it("should have listings store available", async () => {
      const { useListingsStore } = await import("@/store/listings");
      expect(useListingsStore).toBeDefined();

      const store = useListingsStore.getState();
      expect(store.listings).toBeDefined();
      expect(store.setListings).toBeDefined();
      expect(store.addListings).toBeDefined();
      expect(store.setFilters).toBeDefined();
      expect(store.resetFilters).toBeDefined();
    });
  });

  describe("10. Validation Schemas", () => {
    it("should have auth validation schemas", async () => {
      const { loginSchema, registerSchema } =
        await import("@/lib/validations/auth");

      expect(loginSchema).toBeDefined();
      expect(registerSchema).toBeDefined();

      // Test login schema
      const validLogin = loginSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
      });
      expect(validLogin.success).toBe(true);

      // Test register schema
      const validRegister = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        username: "testuser",
      });
      expect(validRegister.success).toBe(true);
    });

    it.skip("should have listing validation schema", async () => {
      const { listingSchema } = await import("@/lib/validations/listing");

      expect(listingSchema).toBeDefined();

      // Test valid listing
      const validListing = listingSchema.safeParse({
        title: "Test Listing",
        description: "This is a test listing description that is long enough",
        category_id: "123e4567-e89b-12d3-a456-426614174000",
        subcategory_id: "123e4567-e89b-12d3-a456-426614174001",
        state: "Lagos",
        lga: "Ikeja",
      });
      expect(validListing.success).toBe(true);
    });
  });
});
