"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star, TrendingUp, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroSectionProps, PlatformStats, FloatingBadge } from "./types";

/**
 * HeroSection Component
 * 
 * Above-the-fold section with headline, CTA, animated stats, and search bar.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 * 
 * Features:
 * - Staggered fade-in animations for headline text
 * - Animated stats counter with counting animation
 * - Floating animated badges with subtle motion
 * - Clean background with minimal decorative elements
 * - Full keyboard navigable with visible focus indicators
 * - Touch-friendly 44x44px minimum targets on mobile
 */

// Animation variants for staggered fade-in
const headlineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 100, // 0ms, 100ms, 200ms stagger
      duration: 600,
      ease: "easeOut",
    },
  }),
};

// Floating badge animation variants
const floatingBadgeVariants = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 3000,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Default stats if none provided
const defaultStats: PlatformStats = {
  totalUsers: 50000,
  totalListings: 100000,
  averageRating: 4.9,
};

// Floating badges configuration
const floatingBadges: FloatingBadge[] = [
  {
    id: "trusted",
    icon: "🛡️",
    label: "Trusted Platform",
    position: { top: "20%", left: "5%" },
    delay: 0,
  },
  {
    id: "verified",
    icon: "✓",
    label: "Verified Sellers",
    position: { top: "60%", right: "8%" },
    delay: 500,
  },
  {
    id: "trending",
    icon: "🔥",
    label: "Trending Products",
    position: { bottom: "30%", left: "10%" },
    delay: 1000,
  },
];

interface StatsCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  color: string;
  duration?: number;
}

/**
 * Animated stats counter component
 * Requirements: 1.4 - Animated counting from 0 to target values
 */
function StatsCounter({
  value,
  label,
  icon,
  suffix = "",
  prefix = "",
  decimals = 0,
  color,
  duration = 2000,
}: StatsCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    
    // If user prefers reduced motion, show final value immediately
    if (prefersReducedMotion) {
      setCount(value);
      hasAnimated.current = true;
      return;
    }

    hasAnimated.current = true;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // easeOut easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(value * easedProgress);

      if (currentStep >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isInView, value, duration, prefersReducedMotion]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K";
    }
    return num.toFixed(decimals);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green rounded-lg p-2 min-h-[44px] min-w-[44px]"
      role="group"
      aria-label={`${label}: ${prefix}${formatNumber(count)}${suffix}`}
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
    >
      <div className={cn("text-3xl sm:text-4xl font-bold flex items-center justify-center gap-1", color)}>
        <span className="sr-only">{label}</span>
        {icon}
        <span aria-hidden="false">
          {prefix}
          {formatNumber(count)}
          {suffix}
        </span>
      </div>
      <div className="text-gray-400 text-sm mt-1" aria-hidden="true">{label}</div>
    </motion.div>
  );
}

interface FloatingBadgeComponentProps {
  badge: FloatingBadge;
}

/**
 * Floating badge with subtle motion animation
 * Requirements: 1.6 - Floating animated badges with subtle motion
 */
function FloatingBadgeComponent({ badge }: FloatingBadgeComponentProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className="absolute hidden lg:flex items-center gap-2 bg-dark-card/80 backdrop-blur-sm border border-dark-border rounded-full px-4 py-2 shadow-lg"
        style={badge.position}
        aria-hidden="true"
      >
        <span className="text-lg">{badge.icon}</span>
        <span className="text-sm font-medium text-white">{badge.label}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, ...floatingBadgeVariants.animate }}
      transition={{
        opacity: { duration: 0.5, delay: badge.delay / 1000 },
        scale: { duration: 0.5, delay: badge.delay / 1000 },
        y: { delay: badge.delay / 1000 },
      }}
      className="absolute hidden lg:flex items-center gap-2 bg-dark-card/80 backdrop-blur-sm border border-dark-border rounded-full px-4 py-2 shadow-lg"
      style={badge.position}
      aria-hidden="true"
    >
      <span className="text-lg">{badge.icon}</span>
      <span className="text-sm font-medium text-white">{badge.label}</span>
    </motion.div>
  );
}

/**
 * HeroSection - Main hero section component
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
export function HeroSection({ stats = defaultStats, className }: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const headlineParts = [
    { text: "Find It.", gradient: true },
    { text: "Buy It.", gradient: true },
    { text: "Own It.", gradient: false },
  ];

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden",
        className
      )}
      aria-labelledby="hero-headline"
    >
      {/* Clean background with minimal decorative elements - Requirement 1.7 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pointer-events-none" />
      
      {/* Subtle gradient accent - no heavy gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-1/2 h-full bg-naija-green/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/4 w-1/2 h-full bg-neon-cyan/5 rounded-full blur-3xl" />
      </div>

      {/* Floating badges - Requirement 1.6 */}
      {floatingBadges.map((badge) => (
        <FloatingBadgeComponent key={badge.id} badge={badge} />
      ))}

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              className="inline-flex items-center gap-2 bg-naija-green/10 border border-naija-green/30 rounded-full px-4 py-2 mb-6"
              role="status"
              aria-label="Nigeria's number one youth marketplace"
            >
              <TrendingUp className="h-4 w-4 text-naija-green" aria-hidden="true" />
              <span className="text-sm font-semibold text-white">
                Nigeria&apos;s #1 Youth Marketplace
              </span>
            </motion.div>

            {/* Headline with staggered fade-in - Requirement 1.3 */}
            {/* Proper heading hierarchy - Requirements: 15.7 */}
            <h1
              id="hero-headline"
              className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight"
              role="heading"
              aria-level={1}
            >
              {headlineParts.map((part, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={prefersReducedMotion ? {} : headlineVariants}
                  className={cn(
                    "block",
                    part.gradient
                      ? "bg-gradient-to-r from-naija-green via-neon-cyan to-neon-purple bg-clip-text text-transparent"
                      : "text-white"
                  )}
                >
                  {part.text}
                </motion.span>
              ))}
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              The most trusted marketplace for Nigerian youth. Buy, sell, and discover
              amazing deals with{" "}
              <span className="text-naija-green font-semibold">AI-powered protection</span>{" "}
              and{" "}
              <span className="text-neon-cyan font-semibold">verified sellers</span>.
            </motion.p>

            {/* CTA Buttons - Requirement 1.5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10"
            >
              <a
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-naija-green-dark to-neon-cyan text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-naija-green/30 hover:shadow-naija-green/50 hover:scale-105 transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                aria-label="Start selling on FindAm marketplace"
              >
                Start Selling Now
              </a>
              <a
                href="/search"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-neon-cyan/50 text-white font-semibold px-8 py-4 rounded-xl hover:bg-neon-cyan/10 hover:border-neon-cyan hover:scale-105 transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                aria-label="Explore deals and listings"
              >
                Explore Deals
              </a>
            </motion.div>

            {/* Animated Stats Counter - Requirement 1.4 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex items-center justify-center lg:justify-start gap-6 sm:gap-8"
              role="region"
              aria-label="Platform statistics"
            >
              <StatsCounter
                value={stats.totalUsers}
                label="Active Users"
                icon={<Users className="h-5 w-5 text-naija-green" aria-hidden="true" />}
                suffix="+"
                color="text-naija-green"
              />
              
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" aria-hidden="true" />
              
              <StatsCounter
                value={stats.totalListings}
                label="Listings"
                icon={<Package className="h-5 w-5 text-neon-cyan" aria-hidden="true" />}
                suffix="+"
                color="text-neon-cyan"
              />
              
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" aria-hidden="true" />
              
              <StatsCounter
                value={stats.averageRating}
                label="Rating"
                icon={<Star className="h-5 w-5 text-neon-purple" aria-hidden="true" />}
                decimals={1}
                color="text-neon-purple"
              />
            </motion.div>
          </div>

          {/* Right: Visual Elements - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block relative h-[500px]" aria-hidden="true" role="presentation">
            {/* Animated cards showing marketplace activity - decorative only */}
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-64 bg-dark-card/90 backdrop-blur-xl border border-dark-border rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-naija-green/20 flex items-center justify-center" aria-hidden="true">
                  <Package className="h-6 w-6 text-naija-green" aria-hidden="true" role="img" aria-label="Package icon" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">New Listing</div>
                  <div className="font-semibold text-white">iPhone 15 Pro</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-naija-green">₦850,000</div>
            </motion.div>

            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-0 left-0 w-56 bg-dark-card/90 backdrop-blur-xl border border-dark-border rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-naija-green" aria-hidden="true" />
                <span className="text-sm font-semibold text-white">Verified Seller</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>✓ Phone</span>
                <span>✓ NIN</span>
                <span>✓ Video</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
