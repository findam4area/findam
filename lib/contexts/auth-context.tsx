"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types";
import {
  savePreference,
  getPreference,
  clearStore,
  STORES,
} from "@/lib/utils/offline-storage";
import { sessionManager } from "@/lib/utils/session-manager";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    phone?: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (
    provider: "google" | "facebook",
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log("Fetching profile for user ID:", userId);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2),
        });
        throw error;
      }

      if (!data) {
        console.error("No profile data returned for user:", userId);
        return null;
      }

      console.log("Profile fetched successfully:", data.username);
      return data as User;
    } catch (error: any) {
      console.error("Error fetching user profile:", {
        error: error instanceof Error ? error.message : String(error),
        message: error?.message,
        code: error?.code,
        details: error?.details,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
      return null;
    }
  };

  // Save session state to IndexedDB
  const saveSessionState = async (
    currentUser: User | null,
    currentSession: Session | null,
  ) => {
    try {
      if (currentUser && currentSession) {
        await savePreference("last_user", currentUser);
        await savePreference("last_session_timestamp", Date.now());
      }
    } catch (error) {
      console.error("Error saving session state:", error);
    }
  };

  // Restore session state from IndexedDB
  const restoreSession = async () => {
    try {
      const lastUser = await getPreference<User>("last_user");
      const lastTimestamp = await getPreference<number>(
        "last_session_timestamp",
      );

      // Check if session is recent (within 7 days)
      if (lastUser && lastTimestamp) {
        const daysSinceLastSession =
          (Date.now() - lastTimestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSession < 7) {
          // Attempt to restore session
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (currentSession) {
            setSession(currentSession);
            setSupabaseUser(currentSession.user);
            const profile = await fetchUserProfile(currentSession.user.id);
            setUser(profile);
            await saveSessionState(profile, currentSession);
          }
        }
      }
    } catch (error) {
      console.error("Error restoring session:", error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to restore session first
        await restoreSession();

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setSupabaseUser(currentSession.user);
          const profile = await fetchUserProfile(currentSession.user.id);
          setUser(profile);
          await saveSessionState(profile, currentSession);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);

      setSession(currentSession);
      setSupabaseUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        console.log("User authenticated, fetching profile...");
        let profile = await fetchUserProfile(currentSession.user.id);

        // If profile doesn't exist, try to create it
        if (!profile && currentSession.user.email) {
          console.warn("Profile missing during auth change, creating...");
          profile = await createMissingProfile(
            currentSession.user.id,
            currentSession.user.email,
          );
        }

        setUser(profile);
        await saveSessionState(profile, currentSession);
      } else {
        setUser(null);
        // Clear session state on logout
        await savePreference("last_user", null);
        await savePreference("last_session_timestamp", null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (
    email: string,
    password: string,
    username: string,
    phone?: string,
  ): Promise<{ error: Error | null }> => {
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (existingUser) {
        return { error: new Error("Username already exists") };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            phone,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile in database
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email,
          username,
          phone,
          role: "user",
          tier: "free",
          trust_score: 10,
          is_premium: false,
          is_phone_verified: false,
          is_nin_verified: false,
          is_video_verified: false,
          is_suspended: false,
        });

        if (profileError) {
          console.error("Error creating user profile:", {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
            fullError: JSON.stringify(profileError, null, 2),
          });
          // Don't throw error - let the trigger handle it
          // The trigger will create the profile if this fails
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Create profile if missing (fallback)
  const createMissingProfile = async (
    userId: string,
    email: string,
  ): Promise<User | null> => {
    try {
      console.log("Attempting to create missing profile for:", email);

      // Generate username from email
      const username = email.split("@")[0] + "_" + Date.now();

      const { data, error } = await supabase
        .from("users")
        .insert({
          id: userId,
          email,
          username,
          role: "user",
          tier: "free",
          trust_score: 10,
          is_premium: false,
          is_phone_verified: false,
          is_nin_verified: false,
          is_video_verified: false,
          is_suspended: false,
          is_service_provider: false,
          is_job_seeker: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2),
        });
        return null;
      }

      console.log("Profile created successfully:", data.username);
      return data as User;
    } catch (error) {
      console.error("Exception creating profile:", error);
      return null;
    }
  };

  // Sign in with email and password
  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null }> => {
    try {
      console.log("Attempting sign in for:", email);

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      console.log("Auth successful, fetching profile...");

      // Restore user preferences and saved data on login
      if (data.session) {
        let profile = await fetchUserProfile(data.session.user.id);

        // If profile doesn't exist, try to create it
        if (!profile) {
          console.warn("Profile not found, attempting to create...");
          profile = await createMissingProfile(
            data.session.user.id,
            data.session.user.email || email,
          );
        }

        if (profile) {
          await saveSessionState(profile, data.session);

          // Restore complete session (preferences, saved listings, etc.)
          await sessionManager.restoreCompleteSession(profile.id);

          console.log("Sign in complete, profile and session restored");
        } else {
          console.error("Failed to load or create profile");
        }
      }

      return { error: null };
    } catch (error) {
      console.error("Sign in exception:", error);
      return { error: error as Error };
    }
  };

  // Sign in with OAuth provider
  const signInWithOAuth = async (
    provider: "google" | "facebook",
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const userId = user?.id;

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSupabaseUser(null);
      setSession(null);

      // Clear session state and cached data
      await savePreference("last_user", null);
      await savePreference("last_session_timestamp", null);

      // Clear session manager state
      if (userId) {
        await sessionManager.clearSession(userId);
      }

      // Optionally clear cached data (uncomment if needed)
      // await clearStore(STORES.LISTINGS);
      // await clearStore(STORES.CONVERSATIONS);
      // await clearStore(STORES.MESSAGES);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Refresh user profile
  const refreshUser = async () => {
    if (supabaseUser) {
      const profile = await fetchUserProfile(supabaseUser.id);
      setUser(profile);
      if (session) {
        await saveSessionState(profile, session);
      }
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    isLoading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    refreshUser,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
