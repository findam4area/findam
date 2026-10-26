/**
 * TrustSection Component
 * 
 * Displays trust indicators, testimonials, and platform statistics.
 * 
 * Requirements:
 * - 6.1: Display security features (ScamShield, verification, secure payments)
 * - 6.2: Display user testimonials with names, roles, ratings, and text
 * - 6.3: Display aggregate statistics (users, listings, rating)
 * - 6.4: Add hover effects (lift, glow) on testimonial cards
 * - 6.5: Display verification badges with tooltips
 * - 6.6: Display payment method logos and security certifications
 * - 6.7: Implement carousel or grid layout for testimonials
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Shield,
  CheckCircle,
  Lock,
  Star,
  Users,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOptimizedImageProps,
  shouldPrioritize,
} from "@/lib/utils/image-optimization";

/**
 * Testimonial interface
 */
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number; // 1-5 inclusive (Requirement 6.10)
  text: string;
  avatar: string;
}

/**
 * Platform statistics interface
 */
export interface PlatformStats {
  totalUsers: number;
  totalListings: number;
  averageRating: number;
}

export interface TrustSectionProps {
  testimonials?: Testimonial[];
  stats?: PlatformStats;
  className?: string;
}

/**
 * Security Feature Card
 */
function SecurityFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center text-center p-6 rounded-xl bg-card border hover:border-primary/40 transition-colors"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

/**
 * Star Rating Display
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Testimonial Card (Requirement 6.2)
 */
function TestimonialCard({
  testimonial,
  index = 0,
}: {
  testimonial: Testimonial;
  index?: number;
}) {
  return (
    <motion.div
      className="p-6 rounded-xl bg-card border hover:border-primary/40 transition-colors h-full flex flex-col"
      whileHover={{
        y: -4,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Rating */}
      <div className="mb-4">
        <StarRating rating={testimonial.rating} />
      </div>

      {/* Testimonial Text */}
      <p className="text-muted-foreground mb-6 flex-1 italic">
        "{testimonial.text}"
      </p>

      {/* Author Info */}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
          <Image
            {...getOptimizedImageProps(
              testimonial.avatar,
              shouldPrioritize(index, 3), // First 3 testimonials visible
              "48px"
            )}
            alt={testimonial.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Statistics Display (Requirement 6.3)
 */
function StatsDisplay({ stats }: { stats: PlatformStats }) {
  const statItems = [
    {
      icon: Users,
      label: "Active Users",
      value: stats.totalUsers.toLocaleString(),
      suffix: "+",
    },
    {
      icon: Package,
      label: "Total Listings",
      value: stats.totalListings.toLocaleString(),
      suffix: "+",
    },
    {
      icon: Star,
      label: "Average Rating",
      value: stats.averageRating.toFixed(1),
      suffix: "/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <stat.icon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-3xl font-bold mb-1">
            {stat.value}
            <span className="text-xl text-muted-foreground">{stat.suffix}</span>
          </p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * TrustSection Component
 */
export function TrustSection({
  testimonials = [],
  stats = {
    totalUsers: 50000,
    totalListings: 100000,
    averageRating: 4.8,
  },
  className = "",
}: TrustSectionProps) {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Security features (Requirement 6.1)
  const securityFeatures = [
    {
      icon: Shield,
      title: "ScamShield Protection",
      description: "AI-powered fraud detection keeps you safe from scams",
    },
    {
      icon: CheckCircle,
      title: "Verified Sellers",
      description: "Multi-level verification including phone, NIN, and video",
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "Bank-grade encryption and secure payment processing",
    },
  ];

  // Default testimonials if none provided
  const defaultTestimonials: Testimonial[] = [
    {
      id: "1",
      name: "Adebayo Johnson",
      role: "Small Business Owner",
      rating: 5,
      text: "FindAm has transformed how I sell my products. The verification system gives my customers confidence, and I've seen a 300% increase in sales!",
      avatar: "/avatars/user1.jpg",
    },
    {
      id: "2",
      name: "Chioma Okafor",
      role: "Fashion Designer",
      rating: 5,
      text: "The platform is incredibly easy to use. I love the ScamShield feature - it gives me peace of mind when dealing with new buyers.",
      avatar: "/avatars/user2.jpg",
    },
    {
      id: "3",
      name: "Ibrahim Musa",
      role: "Electronics Vendor",
      rating: 4,
      text: "Great marketplace with excellent customer support. The boost feature really helped my listings get more visibility.",
      avatar: "/avatars/user3.jpg",
    },
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  const nextTestimonial = () => {
    setCurrentTestimonialIndex((prev) =>
      prev === displayTestimonials.length - 1 ? 0 : prev + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIndex((prev) =>
      prev === 0 ? displayTestimonials.length - 1 : prev - 1
    );
  };

  return (
    <section className={cn("py-16 px-4 md:px-6 lg:px-8 bg-muted/30", className)} aria-labelledby="trust-heading" role="region">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            id="trust-heading"
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Trusted by Thousands
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Join a community of verified buyers and sellers who trust FindAm for safe,
            secure transactions
          </motion.p>
        </div>

        {/* Platform Statistics (Requirement 6.3) */}
        <StatsDisplay stats={stats} />

        {/* Security Features Grid (Requirement 6.1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16" role="list" aria-label="Security features">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <SecurityFeature {...feature} />
            </motion.div>
          ))}
        </div>

        {/* Testimonials Section (Requirement 6.2, 6.7) */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-8" id="testimonials-subheading">
            What Our Users Say
          </h3>

          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6" role="list" aria-labelledby="testimonials-subheading">
            {displayTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <TestimonialCard testimonial={testimonial} index={index} />
              </motion.div>
            ))}
          </div>

          {/* Mobile: Carousel Layout */}
          <div className="md:hidden relative" role="region" aria-label="Testimonials carousel" aria-roledescription="carousel">
            <div className="overflow-hidden">
              <motion.div
                className="flex"
                animate={{ x: `-${currentTestimonialIndex * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {displayTestimonials.map((testimonial, index) => (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-2">
                    <TestimonialCard testimonial={testimonial} index={index} />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-card border hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {displayTestimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonialIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      index === currentTestimonialIndex
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/30"
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                    aria-current={index === currentTestimonialIndex ? "true" : undefined}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-card border hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Payment Methods & Security Badges (Requirement 6.6) */}
        <motion.div
          className="flex flex-col items-center justify-center gap-6 pt-12 border-t"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground">Secure payments powered by</p>
          <div className="flex items-center gap-8 flex-wrap justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
              <Lock className="w-5 h-5 text-primary" />
              <span className="font-semibold">Paystack</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold">PCI Compliant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
