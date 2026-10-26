import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ImageGallery } from "@/components/features/image-gallery";
import type { ImageGalleryImage } from "@/components/features/image-gallery";
import { Phone, Mail, MessageCircle, Flag, MapPin, Calendar, Eye } from "lucide-react";
import Link from "next/link";
import { VendorBadge } from "@/components/shared/vendor-badge";

// Type definition for media items from Supabase
interface MediaItem {
  media_url: string;
  media_type: string;
}

/**
 * ListingDetail Page with Image Gallery
 * 
 * This Server Component displays complete listing information with:
 * - Multi-image gallery (3-5 images) with ImageGallery component
 * - Complete listing details (title, description, price, category, location)
 * - Vendor information with approved badge if applicable
 * - Functional contact buttons (Call, WhatsApp, Email)
 * - Report listing button
 * - SEO metadata with Open Graph tags
 * - Mobile-first responsive layout
 * - Proper error handling for listing not found
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11, 17.12
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch listing for metadata
  const { data: listing } = await supabase
    .from("listings")
    .select(`
      id, title, description, price, thumbnail_url, state, lga,
      media:listing_media(media_url, media_type)
    `)
    .eq("id", id)
    .single();

  if (!listing) {
    return {
      title: "Listing Not Found | FindAm",
      description: "The listing you're looking for could not be found.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://findam.vercel.app";
  const url = `${baseUrl}/listings/${id}`;
  
  // Get primary image (from thumbnail_url or first media item)
  const primaryImage = listing.thumbnail_url || 
    (listing.media && listing.media.length > 0 ? listing.media[0].media_url : null);

  // Format price for metadata
  const priceText = listing.price != null
    ? ` - ₦${Number(listing.price).toLocaleString()}`
    : "";
  
  // Format location (using old schema fields: state, lga)
  const locationText = listing.lga && listing.state
    ? ` in ${listing.lga}, ${listing.state}`
    : listing.state
      ? ` in ${listing.state}`
      : "";

  // Requirement 17.10: SEO metadata with Open Graph tags
  return {
    title: `${listing.title}${priceText} | FindAm`,
    description: listing.description.substring(0, 160),
    openGraph: {
      title: `${listing.title}${priceText}`,
      description: listing.description.substring(0, 160),
      url,
      siteName: "FindAm - Nigeria's Curated Directory",
      images: primaryImage
        ? [
            {
              url: primaryImage,
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
      title: `${listing.title}${priceText}`,
      description: listing.description.substring(0, 160),
      images: primaryImage ? [primaryImage] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Requirement 17.1: Fetch listing with joins (user, category, approved_vendors)
  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      user:users(id, email, username, phone, avatar_url),
      media:listing_media(*)
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single();

  // Requirement 17.11: Proper error handling (listing not found)
  if (error || !listing) {
    notFound();
  }

  // Fetch vendor status separately if needed (since join might not work)
  let vendor: { business_name?: string; approved_badge_enabled?: boolean } | null = null;
  if (listing.user_id) {
    const { data: vendorData } = await supabase
      .from("approved_vendors" as any)
      .select("business_name, approved_badge_enabled")
      .eq("user_id", listing.user_id)
      .single();
    vendor = vendorData as { business_name?: string; approved_badge_enabled?: boolean } | null;
  }

  // Increment view count (non-blocking, don't wait for response)
  const currentSupabase = await createClient();
  void currentSupabase
    .from("listings")
    .update({ views_count: (listing.views_count || 0) + 1 })
    .eq("id", id);

  // Transform listing media to ImageGalleryImage format
  // Requirement 17.2: Display ImageGallery with all listing images
  const galleryImages: ImageGalleryImage[] = (() => {
    if (Array.isArray(listing.media) && listing.media.length > 0) {
      const mediaItems = listing.media as Array<{ media_url: string; media_type: string }>;
      return mediaItems
        .filter((m) => m.media_type === 'image')
        .map((m, index) => ({
          url: m.media_url,
          alt: `${listing.title} - Image ${index + 1}`,
        }));
    }
    if (listing.thumbnail_url) {
      return [{ url: listing.thumbnail_url, alt: listing.title }];
    }
    return [];
  })();

  // Get primary image index (default to 0)
  const primaryImageIndex = 0;

  // Format phone number for WhatsApp (remove spaces, dashes)
  const formatPhoneForWhatsApp = (phone: string | null) => {
    if (!phone) return null;
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Add country code if not present
    if (!cleaned.startsWith('234') && !cleaned.startsWith('+234')) {
      // Assume Nigerian number starting with 0
      return `234${cleaned.startsWith('0') ? cleaned.substring(1) : cleaned}`;
    }
    return cleaned.replace(/^\+/, '');
  };

  const whatsappNumber = formatPhoneForWhatsApp(listing.user?.phone || null);

  // Requirement 17.12: Mobile-first responsive layout
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            {/* Requirement 17.3, 17.4, 17.5, 17.8: ImageGallery with all features */}
            {galleryImages.length > 0 ? (
              <ImageGallery
                images={galleryImages}
                primaryIndex={primaryImageIndex}
                alt={listing.title}
                className="w-full"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">No images available</p>
              </div>
            )}
          </div>

          {/* Right Column: Listing Details */}
          <div className="space-y-6">
            {/* Requirement 17.1: Title, description, price, category, location */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">{listing.title}</h1>
              
              {/* Price */}
              {listing.price && (
                <div className="mb-4">
                  <p className="text-4xl sm:text-5xl font-bold text-primary-500">
                    ₦{Number(listing.price).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Category and Location */}
              <div className="flex flex-wrap gap-3 mb-4">
                {listing.category && (
                  <Link
                    href={`/categories/${listing.category.id}`}
                    className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-sm transition-colors"
                  >
                    <span className="font-medium">{listing.category.name}</span>
                  </Link>
                )}
                
                {listing.lga && listing.state && (
                  <div className="inline-flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{listing.lga}, {listing.state}</span>
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {listing.is_boosted && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-full text-xs font-semibold">
                    ⚡ Boosted
                  </span>
                )}
                
                {listing.status === 'pending' && (
                  <span className="inline-flex items-center gap-1 bg-yellow-600 px-3 py-1 rounded-full text-xs font-semibold">
                    ⏳ Pending Approval
                  </span>
                )}
              </div>
            </div>

            {/* Requirement 17.7: Contact buttons (Call, WhatsApp, Email) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Call Button */}
              {listing.user?.phone && (
                <a
                  href={`tel:${listing.user.phone}`}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call</span>
                </a>
              )}

              {/* WhatsApp Button */}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi! I'm interested in: ${listing.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* Email Button */}
              {listing.user?.email && (
                <a
                  href={`mailto:${listing.user.email}?subject=${encodeURIComponent(`Inquiry about: ${listing.title}`)}`}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </a>
              )}
            </div>

            {/* Listing Info Card */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Posted
                </span>
                <span className="font-medium">
                  {listing.created_at && new Date(listing.created_at).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Views
                </span>
                <span className="font-medium">{listing.views_count || 0}</span>
              </div>

              {listing.condition && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Condition</span>
                  <span className="font-medium capitalize">{listing.condition}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Requirement 17.6: Vendor information with approved badge */}
            {listing.user && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {listing.user.avatar_url ? (
                      <img
                        src={listing.user.avatar_url}
                        alt={listing.user.username || 'User'}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-gray-300">
                          {listing.user.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{listing.user.username || 'Anonymous User'}</h3>
                      
                      {/* Requirement 17.6: Approved vendor badge - Task 8.14: Use VendorBadge component */}
                      {vendor && vendor.approved_badge_enabled && (
                        <VendorBadge size="sm" />
                      )}
                    </div>

                    {vendor && (
                      <p className="text-sm text-gray-400 mb-2">
                        {vendor.business_name}
                      </p>
                    )}

                    <p className="text-sm text-gray-400">
                      Member since {listing.created_at && new Date(listing.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Requirement 17.8: Report Listing button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950"
              onClick={() => {
                // TODO: Implement report functionality
                alert('Report listing functionality will be implemented');
              }}
            >
              <Flag className="w-5 h-5" />
              <span>Report this listing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
