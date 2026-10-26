import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user profile exists, create if not (for OAuth users)
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Create user profile for OAuth user
        const username =
          data.user.user_metadata.username ||
          data.user.email?.split("@")[0] ||
          `user_${data.user.id.slice(0, 8)}`;

        await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email!,
          username,
          avatar_url: data.user.user_metadata.avatar_url,
          trust_score: 10,
          is_premium: false,
          phone_verified: false,
          nin_verified: false,
          video_verified: false,
          is_suspended: false,
          is_service_provider: false,
          is_job_seeker: false,
        });
      }

      // Redirect to feed after successful OAuth
      return NextResponse.redirect(`${origin}/feed`);
    }
  }

  // Redirect to login on error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
