import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../auth";

describe("Auth Store", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true });
  });

  it("should initialize with null user", () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });

  it("should set user correctly", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      username: "testuser",
      trust_score: 50,
      is_premium: false,
      phone_verified: false,
      nin_verified: false,
      video_verified: false,
      is_suspended: false,
      is_service_provider: false,
      is_job_seeker: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    useAuthStore.getState().setUser(mockUser);
    const { user, isLoading } = useAuthStore.getState();

    expect(user).toEqual(mockUser);
    expect(isLoading).toBe(false);
  });

  it("should clear user correctly", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      username: "testuser",
      trust_score: 50,
      is_premium: false,
      phone_verified: false,
      nin_verified: false,
      video_verified: false,
      is_suspended: false,
      is_service_provider: false,
      is_job_seeker: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().clearUser();

    const { user, isLoading } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isLoading).toBe(false);
  });

  it("should set loading state", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
