"use client";

import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TrustScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TrustScore({
  score,
  size = "md",
  showLabel = true,
  className,
}: TrustScoreProps) {
  const sizes = {
    sm: {
      container: "h-12 w-12",
      text: "text-xs",
      icon: "h-4 w-4",
    },
    md: {
      container: "h-16 w-16",
      text: "text-sm",
      icon: "h-5 w-5",
    },
    lg: {
      container: "h-24 w-24",
      text: "text-lg",
      icon: "h-6 w-6",
    },
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-naija-green";
    if (score >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-naija-green to-neon-cyan";
    if (score >= 50) return "from-yellow-400 to-orange-400";
    return "from-orange-400 to-red-400";
  };

  const sizeConfig = sizes[size];
  const scoreColor = getScoreColor(score);
  const scoreGradient = getScoreGradient(score);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          sizeConfig.container,
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-dark-card" />

        {/* Progress circle */}
        <svg
          className="absolute inset-0 -rotate-90 transform"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-dark-border"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 45 * (1 - score / 100),
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient
              id="scoreGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                className={cn(
                  "stop-color",
                  scoreGradient.split(" ")[0].replace("from-", ""),
                )}
              />
              <stop
                offset="100%"
                className={cn(
                  "stop-color",
                  scoreGradient.split(" ")[1].replace("to-", ""),
                )}
              />
            </linearGradient>
          </defs>
        </svg>

        {/* Score text */}
        <div className="relative z-10 flex flex-col items-center">
          <Shield className={cn(sizeConfig.icon, scoreColor)} />
          <span className={cn("font-bold", sizeConfig.text, scoreColor)}>
            {score}
          </span>
        </div>
      </motion.div>

      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-medium text-gray-400">Trust Score</p>
        </div>
      )}
    </div>
  );
}
