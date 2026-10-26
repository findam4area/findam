import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrivacySettings } from "@/components/gdpr/privacy-settings";

/**
 * Privacy Settings Page
 * Requirements: 18.9, 30.10, 31.6, 31.7, 31.8
 * 
 * Provides user controls for:
 * - Cookie consent management
 * - Data export (GDPR Article 15)
 * - Data deletion (GDPR Article 17)
 * - Privacy preferences
 */
export default async function PrivacySettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile for deletion schedule check
  const { data: profile } = await supabase
    .from("profiles")
    .select("deletion_scheduled_at, status")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Privacy & Data Settings
        </h1>
        <p className="text-gray-400">
          Manage your privacy preferences and exercise your data rights
        </p>
      </div>

      <PrivacySettings
        userId={user.id}
        userEmail={user.email || ""}
        deletionScheduledAt={null}
        accountStatus={"active"}
      />
    </div>
  );
}
