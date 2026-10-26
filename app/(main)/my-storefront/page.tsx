import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { storefrontService } from "@/lib/services/storefront";
import { StorefrontCustomizer } from "@/components/storefront";

export default async function MyStorefrontPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get or create storefront
  const storefront = await storefrontService.getOrCreateStorefront(user.id);

  // Get user's listings for featured selection
  const { data: listings } = await (supabase as any)
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Get user data
  const { data: userData } = await (supabase as any)
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  const storefrontUrl = `/store/${userData?.username || storefront.custom_url}`;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Storefront</h1>
        <Link
          href={storefrontUrl}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          View Storefront
        </Link>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Storefront Settings
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Storefront URL
            </label>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded bg-gray-100 px-3 py-2 text-sm">
                findamng.com{storefrontUrl}
              </code>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Display Name
            </label>
            <p className="mt-1 text-gray-900">
              {storefront.display_name || "Not set"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <p className="mt-1 text-gray-900">{storefront.bio || "Not set"}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Theme Color
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: storefront.theme_color }}
              />
              <code className="text-sm text-gray-600">
                {storefront.theme_color}
              </code>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Featured Products
            </label>
            <p className="mt-1 text-gray-900">
              {storefront.featured_listings?.length || 0} of 6 selected
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Followers
            </label>
            <p className="mt-1 text-gray-900">{storefront.follower_count}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-blue-900">
          Customize Your Storefront
        </h3>
        <p className="mb-4 text-blue-800">
          Click the customize button in the bottom right to personalize your
          storefront with a custom banner, theme color, bio, and featured
          products.
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
          <li>Upload a banner image to showcase your brand</li>
          <li>Choose a theme color that matches your style</li>
          <li>Write a bio to tell customers about your business</li>
          <li>Feature up to 6 products at the top of your storefront</li>
        </ul>
      </div>

      {/* Customizer Component */}
      <StorefrontCustomizer storefront={storefront} listings={listings || []} />
    </div>
  );
}
