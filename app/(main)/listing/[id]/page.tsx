import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LocationDisplay } from "@/components/location";
import { PriceDisplay } from "@/components/shared";
import type { Listing } from "@/lib/types";
import type { Metadata } from "next";
import Image from "next/image";
import { ListingInteractions } from "./listing-interactions";
import { getListingInteractionStatus } from "@/lib/api/interactions";
import { ListingReviewsSection } from "@/components/reviews";
import { VendorBadge } from "@/components/shared/vendor-badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, description, price, thumbnail_url, state, lga")
    .eq("id", id)
    .single();

  if (!listing) {
    return {
      title: "Listing Not Found | FindAm",
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://findam.vercel.app";
  const url = `${baseUrl}/listing/${id}`;
  const priceText =
    listing.price != null
      ? ` - ₦${Number(listing.price).toLocaleString()}`
      : "";
  const locationText = listing.lga
    ? ` in ${listing.lga}, ${listing.state}`
    : listing.state
      ? ` in ${listing.state}`
      : "";

  return {
    title: `${listing.title}${priceText} | FindAm`,
    description: listing.description.substring(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.substring(0, 160),
      url,
      siteName: "FindAm",
      images: listing.thumbnail_url
        ? [
            {
              url: listing.thumbnail_url,
              width: 1200,
              height: 630,
              alt: listing.title,
            },
          ]
        : [],
      locale: "en_NG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: listing.description.substring(0, 160),
      images: listing.thumbnail_url ? [listing.thumbnail_url] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      user:users(*),
      category:categories(*),
      subcategory:subcategories(*),
      media:listing_media(*),
      vendor:approved_vendors(user_id, business_name, approved_at, approved_badge_enabled)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !listing) {
    notFound();
  }

  // Type assertion for proper typing
  const typedListing = listing as unknown as ListingWithRelations;

  // Get current user for interaction status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let interactionStatus = { isLiked: false, isSaved: false };
  if (user) {
    try {
      interactionStatus = await getListingInteractionStatus(id, user.id);
    } catch (error) {
      console.error("Error fetching interaction status:", error);
    }
  }

  // Increment view count
  await supabase
    .from("listings")
    .update({ views_count: (typedListing.views_count || 0) + 1 })
    .eq("id", id);

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Media Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            {typedListing.media && typedListing.media.length > 0 ? (
              <>
                {typedListing.media[0].media_type === "video" ? (
                  <video
                    src={typedListing.media[0].media_url}
                    className="w-full rounded-xl"
                    controls
                    poster={typedListing.thumbnail_url || undefined}
                  />
                ) : (
                  <Image
                    src={typedListing.media[0].media_url}
                    alt={typedListing.title}
                    className="w-full rounded-xl"
                    width={800}
                    height={600}
                    priority
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                )}
                {typedListing.media.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {typedListing.media.slice(1).map((media, index) => (
                      <div
                        key={media.id}
                        className="aspect-square rounded-lg overflow-hidden"
                      >
                        {media.media_type === "video" ? (
                          <video
                            src={media.media_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={media.media_url}
                            alt={`${typedListing.title} ${index + 2}`}
                            className="w-full h-full object-cover"
                            width={200}
                            height={200}
                            sizes="(max-width: 768px) 25vw, 200px"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-video bg-dark-card rounded-xl flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{typedListing.title}</h1>
              {typedListing.price && (
                <div className="mb-4">
                  <PriceDisplay
                    amount={typedListing.price}
                    size="xl"
                    className="text-5xl"
                  />
                </div>
              )}
              {typedListing.is_boosted && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-naija-green to-neon-cyan px-3 py-1 rounded-full text-sm font-bold">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Boosted
                </span>
              )}
            </div>

            {/* Interaction Buttons */}
            <ListingInteractions
              listing={typedListing}
              initialLiked={interactionStatus.isLiked}
              initialSaved={interactionStatus.isSaved}
            />

            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Condition</span>
                <span className="font-medium capitalize">
                  {typedListing.condition || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Location</span>
                <LocationDisplay
                  state={typedListing.state}
                  area={typedListing.lga}
                  showIcon={false}
                  textClassName="font-medium text-white"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Posted</span>
                <span className="font-medium">
                  {new Date(typedListing.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Views</span>
                <span className="font-medium">
                  {typedListing.views_count || 0}
                </span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap">
                {typedListing.description}
              </p>
            </div>

            {typedListing.user && (
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">Seller</h2>
                <div className="flex items-center gap-4">
                  {typedListing.user.avatar_url ? (
                    <Image
                      src={typedListing.user.avatar_url}
                      alt={typedListing.user.username}
                      className="w-16 h-16 rounded-full"
                      width={64}
                      height={64}
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-dark-card flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {typedListing.user.username}
                      </h3>
                      {/* Task 8.14: Display VendorBadge when seller is approved vendor */}
                      {typedListing.vendor?.approved_badge_enabled && (
                        <VendorBadge size="sm" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>
                        Trust Score: {typedListing.user.trust_score}/100
                      </span>
                      {typedListing.user.phone_verified && (
                        <span className="text-naija-green">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section - Task 19.2 */}
        <div className="mt-12">
          <ListingReviewsSection
            listingId={id}
            vendorId={typedListing.user_id}
            currentUserId={user?.id}
            isVendor={user?.id === typedListing.user_id}
          />
        </div>
      </div>
    </div>
  );
}
