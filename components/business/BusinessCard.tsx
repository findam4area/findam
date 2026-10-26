"use client";

// BusinessCard component with verified badge
// Requirements: 21.3, 21.4, 21.6

import { motion } from "framer-motion";
import { MapPin, Phone, Star, CheckCircle, Mail, Globe } from "lucide-react";
import Link from "next/link";
import { formatNigerianPhone } from "@/lib/utils/phone";
import numeral from "numeral";

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    cover_url: string | null;
    state: string;
    lga: string;
    phone: string;
    email: string | null;
    website: string | null;
    is_verified: boolean;
    average_rating: number | null;
    review_count: number | null;
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-dark-border bg-dark-card backdrop-blur-md"
    >
      <Link href={`/business-profiles/${business.id}`} className="block">
        {/* Cover Image */}
        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-naija-green/20 to-dark-bg">
          {business.cover_url ? (
            <img
              src={business.cover_url}
              alt={`${business.name} cover`}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-naija-green/20" />
            </div>
          )}

          {/* Verified Badge Overlay */}
          {business.is_verified && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-naija-green/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Verified Business</span>
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="relative -mt-12 px-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border-4 border-dark-card bg-dark-bg shadow-xl">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-naija-green to-naija-orange text-2xl font-bold text-white">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
          {/* Business Name */}
          <h3 className="mb-1 text-lg font-bold text-white line-clamp-1">
            {business.name}
          </h3>

          {/* Rating */}
          {business.average_rating && business.review_count ? (
            <div className="mb-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-white">
                  {business.average_rating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                ({numeral(business.review_count).format("0,0")} reviews)
              </span>
            </div>
          ) : null}

          {/* Description */}
          <p className="mb-3 text-sm text-gray-400 line-clamp-2">
            {business.description || "No description provided"}
          </p>

          {/* Location */}
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {business.lga}, {business.state}
            </span>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {business.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{formatNigerianPhone(business.phone)}</span>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{business.email}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span>Website</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Effect Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-naija-green/0 to-transparent opacity-0 transition-opacity group-hover:opacity-10" />
      </Link>
    </motion.div>
  );
}
