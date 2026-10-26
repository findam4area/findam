"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  intensity?: number;
}

const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(
  ({ children, className, containerClassName, intensity = 15 }, ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(
      mouseYSpring,
      [-0.5, 0.5],
      [`${intensity}deg`, `-${intensity}deg`],
    );
    const rotateY = useTransform(
      mouseXSpring,
      [-0.5, 0.5],
      [`-${intensity}deg`, `${intensity}deg`],
    );

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn("relative", containerClassName)}
      >
        <div
          style={{
            transform: "translateZ(50px)",
            transformStyle: "preserve-3d",
          }}
          className={cn("w-full h-full", className)}
        >
          {children}
        </div>
      </motion.div>
    );
  },
);
Card3D.displayName = "Card3D";

export { Card3D };
