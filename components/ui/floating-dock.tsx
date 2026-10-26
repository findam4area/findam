"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { useHydration } from "@/lib/hooks/useHydration";

export interface FloatingDockItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

export interface FloatingDockProps {
  items: FloatingDockItem[];
  className?: string;
  desktopClassName?: string;
  mobileClassName?: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  items,
  className,
  desktopClassName,
  mobileClassName,
}) => {
  return (
    <>
      <FloatingDockDesktop
        items={items}
        className={cn(className, desktopClassName)}
      />
      <FloatingDockMobile
        items={items}
        className={cn(className, mobileClassName)}
      />
    </>
  );
};

const FloatingDockMobile: React.FC<{
  items: FloatingDockItem[];
  className?: string;
}> = ({ items, className }) => {
  const hydrated = useHydration();
  const pathname = usePathname();
  const { triggerSelection } = useHapticFeedback();

  const handleClick = () => {
    triggerSelection();
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-dark-card/95 backdrop-blur-lg border-t border-dark-border",
        "safe-area-inset-bottom",
        className,
      )}
    >
      <nav className="flex items-center justify-around px-2 py-3">
        {items.map((item) => {
          const isActive = hydrated && pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "touch-target p-2 rounded-lg",
                "transition-all duration-200",
                "active:scale-95",
                isActive
                  ? "text-naija-green"
                  : "text-gray-400 hover:text-gray-200",
              )}
              aria-label={item.title}
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon
                  className={cn(
                    "w-6 h-6",
                    isActive && "drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]",
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold",
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const FloatingDockDesktop: React.FC<{
  items: FloatingDockItem[];
  className?: string;
}> = ({ items, className }) => {
  const hydrated = useHydration();
  const mouseX = useMotionValue(Infinity);
  const pathname = usePathname();

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        "h-16 gap-4 items-end rounded-2xl px-4 pb-3",
        "bg-dark-card/80 backdrop-blur-lg border border-dark-border",
        "shadow-[0_0_30px_rgba(0,255,65,0.1)]",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = hydrated && pathname === item.href;
        return (
          <IconContainer
            key={item.href}
            mouseX={mouseX}
            item={item}
            isActive={isActive}
          />
        );
      })}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  item,
  isActive,
}: {
  mouseX: any;
  item: FloatingDockItem;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const Icon = item.icon;

  return (
    <Link href={item.href} aria-label={item.title}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        className={cn(
          "aspect-square rounded-full flex items-center justify-center relative",
          "transition-colors duration-200",
          isActive
            ? "bg-naija-green/20 text-naija-green"
            : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200",
        )}
      >
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-naija-green/20 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center relative z-10"
        >
          <Icon className="w-full h-full" />
        </motion.div>
      </motion.div>
    </Link>
  );
}
