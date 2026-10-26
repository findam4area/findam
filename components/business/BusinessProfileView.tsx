"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BusinessProfile } from "@/lib/types/business-profile";
import { ProductListing } from "@/lib/types/product";
import { ServiceListing } from "@/lib/types/service";
import { BusinessReview } from "@/lib/types/review";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/badges/VerifiedBadge";
import { PremiumBadge } from "@/components/badges/PremiumBadge";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { AverageRating } from "@/components/reviews/average-rating";
import { BusinessReviewsSection } from "@/components/reviews/BusinessReviewsSection";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Package,
  Briefcase,
  Star,
  Eye,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Truck,
  Monitor,
  Users,
  Clock4,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BusinessProfileViewProps {
  profile: BusinessProfile;
  products?: ProductListing[];
  services?: ServiceListing[];
  reviews?: BusinessReview[];
  ratingBreakdown?: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
  isOwner?: boolean;
  currentUserId?: string;
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function BusinessProfileView({
  profile,
  products = [],
  services = [],
  reviews = [],
  ratingBreakdown,
  isOwner = false,
  currentUserId,
}: BusinessProfileViewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const photos = profile.photo_urls || [];
  const hasPhotos = photos.length > 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const getServiceAttributeIcon = (attr: string) => {
    switch (attr) {
      case "delivery_available":
        return <Truck className="w-4 h-4" />;
      case "online_service":
        return <Monitor className="w-4 h-4" />;
      case "in_person_service":
        return <Users className="w-4 h-4" />;
      case "availability_24_7":
        return <Clock4 className="w-4 h-4" />;
      case "emergency_service":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getServiceAttributeLabel = (attr: string) => {
    switch (attr) {
      case "delivery_available":
        return "Delivery Available";
      case "online_service":
        return "Online Service";
      case "in_person_service":
        return "In-Person Service";
      case "availability_24_7":
        return "24/7 Availability";
      case "emergency_service":
        return "Emergency Service";
      default:
        return attr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="overflow-hidden">
        {/* Photo Gallery */}
        {hasPhotos && (
          <div className="relative h-96 bg-gray-100 dark:bg-gray-900">
            <Image
              src={photos[currentPhotoIndex] || profile.primary_photo_url || "/placeholder-business.jpg"}
              alt={profile.business_name}
              fill
              className="object-cover cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Photo Counter */}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              </>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              {profile.is_verified && <VerifiedBadge size="lg" showLabel />}
              {profile.is_premium && profile.premium_tier && (
                <PremiumBadge tier={profile.premium_tier} size="lg" showLabel />
              )}
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Business Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{profile.business_name}</h1>
              <div className="flex items-center gap-4 flex-wrap mb-3">
                {profile.average_rating > 0 && (
                  <AverageRating average={profile.average_rating} count={profile.review_count} />
                )}
                <Badge variant="outline" className="text-sm">
                  {profile.primary_category?.name}
                </Badge>
                {profile.price_range && (
                  <Badge variant="outline" className="text-sm">
                    {profile.price_range}
                  </Badge>
                )}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Eye className="w-4 h-4 mr-1" />
                  {profile.view_count} views
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.description}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-4">
              {isOwner ? (
                <Link href={`/business-profiles/${profile.id}/edit`}>
                  <Button>Edit Profile</Button>
                </Link>
              ) : (
                <>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {profile.address && (
              <div className="flex items-start text-sm">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
                <span>
                  {profile.address}, {profile.city}, {profile.state}
                </span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                <a href={`tel:${profile.phone}`} className="hover:underline">
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                <a href={`mailto:${profile.email}`} className="hover:underline">
                  {profile.email}
                </a>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center text-sm">
                <Globe className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {/* Service Attributes */}
          {profile.service_attributes && Object.entries(profile.service_attributes).some(([_, v]) => v) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(profile.service_attributes).map(([key, value]) => 
                value ? (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {getServiceAttributeIcon(key)}
                    {getServiceAttributeLabel(key)}
                  </Badge>
                ) : null
              )}
            </div>
          )}

          {/* Business Hours */}
          {profile.business_hours && Object.keys(profile.business_hours).length > 0 && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Business Hours
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {WEEKDAYS.map((day) => {
                  const hours = profile.business_hours?.[day];
                  return (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize font-medium">{day}:</span>
                      {hours?.open && hours?.close ? (
                        <span>
                          {hours.open} - {hours.close}
                        </span>
                      ) : (
                        <span className="text-gray-500">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Tabs for Products, Services, Reviews */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {products.length > 0 && (
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              Products ({products.length})
            </TabsTrigger>
          )}
          {services.length > 0 && (
            <TabsTrigger value="services">
              <Briefcase className="w-4 h-4 mr-2" />
              Services ({services.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="reviews">
            <Star className="w-4 h-4 mr-2" />
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Products */}
            {products.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Featured Products</h3>
                <div className="grid grid-cols-2 gap-4">
                  {products.slice(0, 4).map((product) => (
                    <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition">
                      <div className="relative aspect-square">
                        <Image
                          src={product.primary_image_url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm mb-1 truncate">{product.title}</h4>
                        <p className="text-lg font-bold">₦{product.price.toLocaleString()}</p>
                      </div>
                    </Card>
                  ))}
                </div>
                {products.length > 4 && (
                  <Link href={`/business-profiles/${profile.id}/products`}>
                    <Button variant="outline" className="w-full mt-4">
                      View All Products
                    </Button>
                  </Link>
                )}
              </Card>
            )}

            {/* Recent Services */}
            {services.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Featured Services</h3>
                <div className="space-y-3">
                  {services.slice(0, 4).map((service) => (
                    <Card key={service.id} className="p-4 hover:shadow-lg transition cursor-pointer">
                      <div className="flex items-start">
                        <div className="relative w-20 h-20 flex-shrink-0 mr-4">
                          <Image
                            src={service.primary_image_url}
                            alt={service.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{service.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {service.description}
                          </p>
                          <p className="text-lg font-bold mt-2">
                            {service.pricing_model === "custom" 
                              ? "Contact for Quote" 
                              : service.pricing_model === "hourly"
                              ? `₦${service.price?.toLocaleString()}/hr`
                              : `₦${service.price?.toLocaleString()}`
                            }
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                {services.length > 4 && (
                  <Link href={`/business-profiles/${profile.id}/services`}>
                    <Button variant="outline" className="w-full mt-4">
                      View All Services
                    </Button>
                  </Link>
                )}
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition">
                <div className="relative aspect-square">
                  <Image
                    src={product.primary_image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                  {!product.is_in_stock && (
                    <Badge className="absolute top-2 left-2 bg-red-600">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-medium mb-2 line-clamp-2">{product.title}</h4>
                  <p className="text-xl font-bold">₦{product.price.toLocaleString()}</p>
                  {product.product_type === "physical" && product.is_in_stock && (
                    <p className="text-xs text-gray-500 mt-1">
                      {product.stock_quantity} in stock
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <Card key={service.id} className="p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Image
                      src={service.primary_image_url}
                      alt={service.title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-2">{service.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {service.description}
                    </p>
                    {service.duration_text && (
                      <p className="text-sm text-gray-500 mb-2">
                        Duration: {service.duration_text}
                      </p>
                    )}
                    <p className="text-xl font-bold">
                      {service.pricing_model === "custom" 
                        ? "Contact for Quote" 
                        : service.pricing_model === "hourly"
                        ? `₦${service.price?.toLocaleString()}/hr`
                        : `₦${service.price?.toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <BusinessReviewsSection
            businessProfileId={profile.id}
            currentUserId={currentUserId}
            isOwner={isOwner}
            initialReviews={reviews}
            initialAverageRating={profile.average_rating}
            initialReviewCount={profile.review_count}
            initialRatingBreakdown={ratingBreakdown || {
              five_star: 0,
              four_star: 0,
              three_star: 0,
              two_star: 0,
              one_star: 0,
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Lightbox for photos */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={() => setIsLightboxOpen(false)}
            >
              ×
            </button>
            <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={photos[currentPhotoIndex]}
                alt="Full size"
                fill
                className="object-contain"
              />
            </div>
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
