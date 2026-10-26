"use client";

/**
 * Design System Demo Component
 *
 * This file demonstrates how to use the FindAm design system components.
 * Use this as a reference for implementing the design system in your features.
 */

import React from "react";
import {
  GlassCard,
  NeonButton,
  Card3D,
  ShootingStarsBackground,
  Sparkles,
  AnimatedContainer,
  HoverTilt,
  PullToRefresh,
  SuccessAnimation,
  useSuccessAnimation,
  ParallaxScroll,
} from "./design-system";

export const DesignSystemDemo: React.FC = () => {
  const { show, trigger } = useSuccessAnimation();
  const [refreshCount, setRefreshCount] = React.useState(0);

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Shooting Stars Background */}
      <ShootingStarsBackground starCount={15}>
        <div className="container mx-auto px-4 py-12 space-y-12">
          {/* Header */}
          <AnimatedContainer animation="slideDown">
            <h1 className="text-4xl font-bold text-center neon-text text-naija-green">
              FindAm Design System
            </h1>
            <p className="text-center text-gray-400 mt-2">
              A showcase of all design system components
            </p>
          </AnimatedContainer>

          {/* Glass Cards Section */}
          <section className="space-y-4">
            <AnimatedContainer animation="slideUp" delay={0.1}>
              <h2 className="text-2xl font-semibold text-naija-green">
                Glass Cards
              </h2>
            </AnimatedContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatedContainer animation="scaleIn" delay={0.2}>
                <GlassCard variant="default" className="p-6">
                  <h3 className="font-semibold mb-2">Default Glass</h3>
                  <p className="text-sm text-gray-300">
                    White glass with 10% opacity
                  </p>
                </GlassCard>
              </AnimatedContainer>

              <AnimatedContainer animation="scaleIn" delay={0.3}>
                <GlassCard variant="dark" className="p-6">
                  <h3 className="font-semibold mb-2">Dark Glass</h3>
                  <p className="text-sm text-gray-300">
                    Black glass with 20% opacity
                  </p>
                </GlassCard>
              </AnimatedContainer>

              <AnimatedContainer animation="scaleIn" delay={0.4}>
                <GlassCard variant="neon" className="p-6">
                  <h3 className="font-semibold mb-2">Neon Glass</h3>
                  <p className="text-sm text-gray-300">
                    Dark card with neon border
                  </p>
                </GlassCard>
              </AnimatedContainer>
            </div>
          </section>

          {/* Neon Buttons Section */}
          <section className="space-y-4">
            <AnimatedContainer animation="slideUp" delay={0.5}>
              <h2 className="text-2xl font-semibold text-naija-green">
                Neon Buttons
              </h2>
            </AnimatedContainer>

            <div className="flex flex-wrap gap-4">
              <NeonButton variant="green">Green Button</NeonButton>
              <NeonButton variant="orange">Orange Button</NeonButton>
              <NeonButton variant="purple">Purple Button</NeonButton>
              <NeonButton variant="cyan">Cyan Button</NeonButton>
              <NeonButton variant="outline">Outline Button</NeonButton>
            </div>
          </section>

          {/* 3D Card Effect */}
          <section className="space-y-4">
            <AnimatedContainer animation="slideUp" delay={0.6}>
              <h2 className="text-2xl font-semibold text-naija-green">
                3D Card Effect
              </h2>
              <p className="text-sm text-gray-400">
                Hover over the card to see the effect
              </p>
            </AnimatedContainer>

            <Card3D intensity={15} className="max-w-md">
              <GlassCard variant="neon" className="p-8">
                <h3 className="text-xl font-bold mb-2">3D Tilt Card</h3>
                <p className="text-gray-300">
                  This card tilts in 3D space as you move your mouse over it.
                </p>
              </GlassCard>
            </Card3D>
          </section>

          {/* Hover Tilt */}
          <section className="space-y-4">
            <AnimatedContainer animation="slideUp" delay={0.7}>
              <h2 className="text-2xl font-semibold text-naija-green">
                Hover Tilt with Glow
              </h2>
            </AnimatedContainer>

            <HoverTilt
              tiltIntensity={8}
              scaleOnHover={1.05}
              glowOnHover
              glowColor="rgba(0, 255, 65, 0.3)"
              className="max-w-md"
            >
              <GlassCard variant="card" className="p-6">
                <h3 className="font-semibold mb-2">Hover Me!</h3>
                <p className="text-sm text-gray-300">
                  I tilt and glow when you hover
                </p>
              </GlassCard>
            </HoverTilt>
          </section>

          {/* Sparkles */}
          <section className="space-y-4">
            <AnimatedContainer animation="slideUp" delay={0.8}>
              <h2 className="text-2xl font-semibold text-naija-green">
                Sparkles & Success
              </h2>
            </AnimatedContainer>

            <div className="flex gap-4">
              <Sparkles sparkleCount={8}>
                <GlassCard variant="neon" className="p-6">
                  <h3 className="font-semibold">Sparkly Card</h3>
                </GlassCard>
              </Sparkles>

              <NeonButton
                variant="green"
                onClick={() => trigger("Action completed!")}
              >
                Trigger Success Animation
              </NeonButton>
            </div>
          </section>

          {/* Parallax Scroll */}
          <section className="space-y-4">
            <AnimatedContainer animation="slideUp" delay={0.9}>
              <h2 className="text-2xl font-semibold text-naija-green">
                Parallax Scroll
              </h2>
              <p className="text-sm text-gray-400">
                Scroll to see the parallax effect
              </p>
            </AnimatedContainer>

            <div className="grid grid-cols-2 gap-4">
              <ParallaxScroll speed={0.5} direction="up">
                <GlassCard variant="card" className="p-6 h-64">
                  <h3 className="font-semibold">Parallax Up</h3>
                  <p className="text-sm text-gray-300 mt-2">
                    This moves up as you scroll
                  </p>
                </GlassCard>
              </ParallaxScroll>

              <ParallaxScroll speed={0.5} direction="down">
                <GlassCard variant="card" className="p-6 h-64">
                  <h3 className="font-semibold">Parallax Down</h3>
                  <p className="text-sm text-gray-300 mt-2">
                    This moves down as you scroll
                  </p>
                </GlassCard>
              </ParallaxScroll>
            </div>
          </section>

          {/* Pull to Refresh Demo */}
          <section className="space-y-4">
            <AnimatedContainer animation="slideUp" delay={1.0}>
              <h2 className="text-2xl font-semibold text-naija-green">
                Pull to Refresh
              </h2>
              <p className="text-sm text-gray-400">
                Pull down on mobile or scroll up when at top (Refreshed:{" "}
                {refreshCount} times)
              </p>
            </AnimatedContainer>

            <PullToRefresh
              onRefresh={handleRefresh}
              className="h-64 overflow-auto"
            >
              <GlassCard variant="card" className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded">
                      Item {i + 1}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </PullToRefresh>
          </section>
        </div>
      </ShootingStarsBackground>

      {/* Success Animation */}
      <SuccessAnimation show={show} duration={2000} />
    </div>
  );
};
