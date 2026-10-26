"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput, sanitizeEmail } from "@/lib/utils/sanitization";

export async function signUpAction(formData: FormData) {
  // Sanitize inputs to prevent XSS (Requirement 31.3)
  const email = sanitizeEmail(formData.get("email") as string);
  const password = formData.get("password") as string; // Don't sanitize passwords
  const username = sanitizeInput(formData.get("username") as string);
  const phone = formData.get("phone")
    ? sanitizeInput(formData.get("phone") as string)
    : undefined;

  // Validate input
  const validation = registerSchema.safeParse({
    email,
    password,
    username,
    phone,
  });

  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    };
  }

  const supabase = await createClient();

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existingUser) {
    return { error: "Username already exists" };
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

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Create user profile in database
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      username,
      phone,
      trust_score: 10,
      is_premium: false,
      phone_verified: false,
      nin_verified: false,
      video_verified: false,
      is_suspended: false,
      is_service_provider: false,
      is_job_seeker: false,
    });

    if (profileError) {
      return { error: profileError.message };
    }
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function signInAction(formData: FormData) {
  // Sanitize inputs to prevent XSS (Requirement 31.3)
  const email = sanitizeEmail(formData.get("email") as string);
  const password = formData.get("password") as string; // Don't sanitize passwords

  // Validate input
  const validation = loginSchema.safeParse({ email, password });

  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function signOutAction() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithOAuthAction(provider: "google" | "facebook") {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}
