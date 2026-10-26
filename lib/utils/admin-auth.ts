import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkAdminAuth(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: "Unauthorized", status: 401 };
  }

  // Check if user is admin
  // In production, this should check a proper admin role in the database
  // For now, we check if email contains 'admin' or has specific domain
  const isAdmin =
    user.email?.includes("admin") || user.email?.endsWith("@findam.admin");

  if (!isAdmin) {
    return { isAdmin: false, error: "Forbidden", status: 403 };
  }

  return { isAdmin: true, user };
}
