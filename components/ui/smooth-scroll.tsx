"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export interface SmoothScrollProps {
  children: React.ReactNode;
  options?: {
    duration?: number;
    easing?: (t: number) => number;
    smooth?: boolean;
    smoothTouch?: boolean;
    touchMultiplier?: number;
  };
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({
  children,
  options = {},
}) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: options.duration || 1.2,
      easing:
        options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      smooth: options.smooth !== undefined ? options.smooth : true,
      smoothTouch: options.smoothTouch || false,
      touchMultiplier: options.touchMultiplier || 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [options]);

  return <>{children}</>;
};

export const useSmoothScroll = () => {
  const scrollTo = (
    target: string | number,
    options?: { offset?: number; duration?: number },
  ) => {
    if (typeof window === "undefined") return;

    const lenis = (window as any).lenis as Lenis | undefined;
    if (!lenis) return;

    lenis.scrollTo(target, {
      offset: options?.offset || 0,
      duration: options?.duration,
    });
  };

  const scrollToTop = (options?: { duration?: number }) => {
    scrollTo(0, options);
  };

  return { scrollTo, scrollToTop };
};
