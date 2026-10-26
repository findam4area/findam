import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const glassCardVariants = cva(
  "rounded-lg border backdrop-blur-md transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-white/10 border-white/20",
        dark: "bg-black/20 border-white/10",
        card: "bg-dark-card/70 border-dark-border/50 shadow-xl",
        neon: "bg-dark-card/60 border-naija-green/30 shadow-lg shadow-naija-green/20",
      },
      blur: {
        sm: "backdrop-blur-sm",
        md: "backdrop-blur-md",
        lg: "backdrop-blur-lg",
        xl: "backdrop-blur-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      blur: "md",
    },
  },
);

export interface GlassCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  asChild?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, blur, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, blur, className }))}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
