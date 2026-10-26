"use client";

// Business Profile page with enhanced features
// Requirements: 21.3, 21.4, 21.5, 21.6

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  CheckCircle,
  MessageCircle,
  Share2,
  ChevronLeft,
  ExternalLink,
  Building2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { getBusinessById, getBusinessListings } from "@/lib/services/business";
import { formatNigerianPhone, maskPhoneNumber } from "@/lib/utils/phone";
import numeral from "numeral";
import dynamic from "next/dynamic";
import { ClaimBusinessButton } from "@/components/business/claim-business-button";

const BusinessMap = dynamic(
  () => import("@/components/business/business-map").then((mod) => mod.BusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full flex items-center justify-center bg-dark-bg">
        <div className="text-gray-400">Loading map...</div>
      </div>
    ),
  }
);

export default function BusinessProfilePage() {
  const params = useParams();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [viewMode, setViewMode] = useState<"listings" | "map">("listings");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [businessData, listingsData] = await Promise.all([
          getBusinessById(businessId),
          getBusinessListings(businessId, 10),
        ]);

        setBusiness(businessData);
        setListings(listingsData);
      } catch (error) {
        console.error("Failed to fetch business data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-naija-green border-t-transparent" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-bg px-4 text-center">
        <Building2 className="mb-4 h-16 w-16 text-gray-600" />
        <h2 className="mb-2 text-2xl font-bold text-white">Business Not Found</h2>
        <p className="mb-6 text-gray-400">
          The business you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/businesses"
          className="rounded-lg bg-naija-green px-6 py-3 font-semibold text-white transition-colors hover:bg-naija-green/90"
        >
          Browse Businesses
        </Link>
      </div>
    );
  }

  // Extract coordinates if available
  let coordinates: [number, number] | null = null;
  if (business.coordinates) {
    // PostGIS format: POINT(lng lat)
    const match = business.coordinates.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (match) {
      coordinates = [parseFloat(match[1]), parseFloat(match[2])];
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      {/* Back Button */}
      <div className="border-b border-dark-border bg-dark-card/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link
            href="/businesses"
            className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Directory</span>
          </Link>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-naija-green/20 to-dark-bg">
        {business.cover_url && (
          <img
            src={business.cover_url}
            alt={`${business.name} cover`}
            className="h-full w-full object-cover"
          />
        )}

        {/* Verified Badge */}
        {business.is_verified && (
          <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-naija-green/90 px-4 py-2 font-semibold text-white backdrop-blur-sm">
            <CheckCircle className="h-5 w-5" />
            <span>Verified Business</span>
          </div>
        )}
        
        {/* Claimed Badge */}
        {business.is_claimed && (
          <div className="absolute right-6 top-20 flex items-center gap-2 rounded-full bg-blue-600/90 px-4 py-2 font-semibold text-white backdrop-blur-sm">
            <Shield className="h-5 w-5" />
            <span>Claimed Business</span>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {/* Logo and Header Info */}
        <div className="relative -mt-16 mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
          {/* Logo */}
          <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-dark-bg bg-dark-card shadow-2xl">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-naija-green to-naija-orange text-4xl font-bold text-white">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Business Info */}
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold text-white">{business.name}</h1>

            {/* Rating */}
            {business.average_rating && business.review_count ? (
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold text-white">
                    {business.average_rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  ({numeral(business.review_count).format("0,0")} reviews)
                </span>
              </div>
            ) : null}

            {/* Location */}
            <div className="mb-4 flex items-center gap-2 text-gray-400">
              <MapPin className="h-5 w-5" />
              <span>
                {business.ward && `${business.ward}, `}
                {business.lga}, {business.state}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Claim Business Button */}
              <ClaimBusinessButton
                businessId={business.id}
                businessName={business.name}
                isClaimable={business.is_claimable === true}
                isClaimed={business.is_claimed === true}
              />
              
              <Link
                href={`/messages?business=${business.id}`}
                className="flex items-center gap-2 rounded-lg bg-naija-green px-6 py-3 font-semibold text-white transition-colors hover:bg-naija-green/90"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Message</span>
              </Link>

              <button
                onClick={() => {
                  // Implement share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: business.name,
                      text: business.description || "",
                      url: window.location.href,
                    });
                  }
                }}
                className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-card px-6 py-3 font-semibold text-white transition-colors hover:bg-dark-border"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dark-border bg-dark-card p-6"
            >
              <h2 className="mb-4 text-xl font-bold text-white">About</h2>
              <p className="text-gray-300 leading-relaxed">
                {business.description || "No description provided."}
              </p>
            </motion.div>

            {/* Listings */}
            {listings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-dark-border bg-dark-card p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Listings</h2>
                  <Link
                    href={`/search?business=${business.id}`}
                    className="text-sm text-naija-green hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {listings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/listing/${listing.id}`}
                      className="group overflow-hidden rounded-lg border border-dark-border bg-dark-bg transition-colors hover:border-naija-green/50"
                    >
                      {listing.thumbnail_url && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={listing.thumbnail_url}
                            alt={listing.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="mb-1 font-semibold text-white line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="font-mono text-naija-green">
                          ₦{numeral(listing.price).format("0,0")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Map View */}
            {coordinates && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-dark-border bg-dark-card overflow-hidden"
              >
                <div className="p-4 border-b border-dark-border">
                  <h2 className="text-xl font-bold text-white">Location</h2>
                </div>
                <div className="h-80 w-full">
                  <BusinessMap coordinates={coordinates} businessName={business.name} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-dark-border bg-dark-card p-6"
            >
              <h2 className="mb-4 text-lg font-bold text-white">Contact Information</h2>

              <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-naija-green" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Phone</p>
                    {showPhone ? (
                      <p className="text-white">
                        {formatNigerianPhone(business.phone)}
                      </p>
                    ) : (
                      <button
                        onClick={() => setShowPhone(true)}
                        className="text-naija-green hover:underline"
                      >
                        {maskPhoneNumber(business.phone)} - Click to reveal
                      </button>
                    )}
                  </div>
                </div>

                {/* Email */}
                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-naija-green" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">Email</p>
                      <a
                        href={`mailto:${business.email}`}
                        className="text-white hover:text-naija-green"
                      >
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {business.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-naija-green" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">Website</p>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-white hover:text-naija-green"
                      >
                        <span>Visit Website</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                {business.whatsapp && (
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-naija-green" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">WhatsApp</p>
                      <a
                        href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-naija-green"
                      >
                        {formatNigerianPhone(business.whatsapp)}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Business Hours */}
            {business.business_hours && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-dark-border bg-dark-card p-6"
              >
                <h2 className="mb-4 text-lg font-bold text-white">Business Hours</h2>
                <div className="space-y-2 text-sm">
                  {Object.entries(business.business_hours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize text-gray-400">{day}</span>
                      <span className="font-medium text-white">
                        {hours.open} - {hours.close}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
