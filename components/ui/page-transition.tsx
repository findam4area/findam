"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "fade" | "slide" | "scale" | "slideUp";
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
};

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  variant = "fade",
}) => {
  const selectedVariant = variants[variant];

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
};

export const PageTransitionWrapper: React.FC<{
  children: React.ReactNode;
  routeKey: string;
  variant?: "fade" | "slide" | "scale" | "slideUp";
}> = ({ children, routeKey, variant = "fade" }) => {
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={routeKey} variant={variant}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
};
