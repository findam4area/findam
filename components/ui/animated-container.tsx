"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Spring physics configuration
export const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const softSpringConfig = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

export const bouncySpringConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 20,
};

// Fade in animation
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: springConfig,
};

// Slide up animation
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: springConfig,
};

// Slide down animation
export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: springConfig,
};

// Scale animation
export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: springConfig,
};

// Bounce animation
export const bounceIn = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
  transition: bouncySpringConfig,
};

interface AnimatedContainerProps extends HTMLMotionProps<"div"> {
  animation?: "fadeIn" | "slideUp" | "slideDown" | "scaleIn" | "bounceIn";
  delay?: number;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  animation = "fadeIn",
  delay = 0,
  className,
  children,
  ...props
}) => {
  const animations = {
    fadeIn,
    slideUp,
    slideDown,
    scaleIn,
    bounceIn,
  };

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
      exit={selectedAnimation.exit}
      transition={{ ...selectedAnimation.transition, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
