"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        green:
          "bg-gradient-to-r from-naija-green to-neon-cyan text-black hover:shadow-lg hover:shadow-naija-green/50",
        orange:
          "bg-gradient-to-r from-neon-orange to-neon-pink text-white hover:shadow-lg hover:shadow-neon-orange/50",
        purple:
          "bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-lg hover:shadow-neon-purple/50",
        cyan: "bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:shadow-lg hover:shadow-neon-cyan/50",
        outline:
          "border-2 border-naija-green text-naija-green hover:bg-naija-green/10 hover:shadow-lg hover:shadow-naija-green/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
      shimmer: {
        true: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000",
        false: "",
      },
    },
    defaultVariants: {
      variant: "green",
      size: "default",
      shimmer: true,
    },
  },
);

export interface NeonButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
  asChild?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    { className, variant, size, shimmer, asChild = false, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          neonButtonVariants({ variant, size, shimmer, className }),
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
NeonButton.displayName = "NeonButton";

export { NeonButton, neonButtonVariants };
