import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { PortfolioSection } from "@/components/portfolio";
import { VendorApplicationStatus } from "@/components/profile/vendor-application-status";
import { getVendorStatus, getUserVendorApplication } from "@/lib/services/database";
import type { User } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch user profile data
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!user) {
    redirect("/login");
  }

  // Fetch listings count
  const { count: listingsCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Fetch reviews and calculate average
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", user.id);

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  // Fetch vendor status and application (Requirements: 2.7, 13.13)
  const [vendorStatus, vendorApplication] = await Promise.all([
    getVendorStatus(user.id),
    getUserVendorApplication(user.id),
  ]);

  // Type assertion for proper typing
  const typedUser = user as unknown as User;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <ProfileHeader
        user={typedUser}
        listingsCount={listingsCount || 0}
        averageRating={averageRating}
        reviewsCount={reviews?.length || 0}
        isOwnProfile={true}
      />

      <ProfileEditor user={typedUser} />

      {/* Vendor Application Status - Requirements: 2.7, 13.13 */}
      <VendorApplicationStatus
        vendorStatus={vendorStatus}
        vendorApplication={vendorApplication}
      />

      <PortfolioSection user={typedUser} isOwner={true} />
    </div>
  );
}
