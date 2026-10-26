import { notFound } from "next/navigation";
import { Metadata } from "next";
import { storefrontService } from "@/lib/services/storefront";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontListings } from "@/components/storefront/storefront-listings";
import { StorefrontReviews } from "@/components/storefront/storefront-reviews";
import { StorefrontStats } from "@/components/storefront/storefront-stats";

interface StorefrontPageProps {
  params: Promise<{
    username: string;
  }>;
}

// Generate metadata for SEO and social sharing (Requirement 9.9)
export async function generateMetadata({
  params,
}: StorefrontPageProps): Promise<Metadata> {
  const { username } = await params;
  const storefrontData = await storefrontService.getStorefront(username);

  if (!storefrontData) {
    return {
      title: "Storefront Not Found",
    };
  }

  const { storefront, seller, stats } = storefrontData;

  return {
    title: `${storefront.display_name || seller.username}'s Store | FindAm`,
    description:
      storefront.bio ||
      `Shop from ${seller.username} on FindAm. ${stats.totalSales} sales, ${stats.averageRating.toFixed(1)} rating.`,
    openGraph: {
      title: `${storefront.display_name || seller.username}'s Store`,
      description:
        storefront.bio ||
        `Shop from ${seller.username} on FindAm. ${stats.totalSales} sales, ${stats.averageRating.toFixed(1)} rating.`,
      images: [
        {
          url:
            storefront.banner_url || seller.avatar_url || "/default-banner.jpg",
          width: 1200,
          height: 630,
          alt: `${seller.username}'s storefront`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${storefront.display_name || seller.username}'s Store`,
      description:
        storefront.bio ||
        `Shop from ${seller.username} on FindAm. ${stats.totalSales} sales.`,
      images: [
        storefront.banner_url || seller.avatar_url || "/default-banner.jpg",
      ],
    },
  };
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { username } = await params;
  const storefrontData = await storefrontService.getStorefront(username);

  if (!storefrontData) {
    notFound();
  }

  const { storefront, seller, listings, featuredListings, reviews, stats } =
    storefrontData;

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={
        {
          "--storefront-theme": storefront.theme_color || "#3B82F6",
        } as React.CSSProperties
      }
    >
      {/* Banner */}
      {storefront.banner_url && (
        <div className="relative h-48 w-full overflow-hidden bg-gray-200 md:h-64">
          <img
            src={storefront.banner_url}
            alt="Storefront banner"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header with seller profile */}
        <StorefrontHeader
          storefront={storefront}
          seller={seller}
          stats={stats}
        />

        {/* Statistics */}
        <StorefrontStats stats={stats} seller={seller} />

        {/* Featured Listings */}
        {featuredListings.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Featured Products
            </h2>
            <StorefrontListings listings={featuredListings} featured />
          </section>
        )}

        {/* All Listings */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            All Products ({listings.length})
          </h2>
          <StorefrontListings listings={listings} />
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Customer Reviews ({reviews.length})
            </h2>
            <StorefrontReviews
              reviews={reviews}
              averageRating={stats.averageRating}
            />
          </section>
        )}
      </div>
    </div>
  );
}
