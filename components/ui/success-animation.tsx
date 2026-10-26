"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "./sparkles";
import { cn } from "@/lib/utils";

export interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
  className?: string;
  duration?: number;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  onComplete,
  message = "Success!",
  className,
  duration = 2000,
}) => {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
            className,
          )}
        >
          <Sparkles
            sparkleCount={15}
            colors={["#00ff41", "#00d9ff", "#ff6b35"]}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: 0.1,
              }}
              className="bg-dark-card/90 backdrop-blur-md border border-naija-green/30 rounded-2xl p-8 shadow-2xl shadow-naija-green/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.2,
                }}
                className="flex flex-col items-center gap-4"
              >
                {/* Checkmark */}
                <motion.div
                  className="w-20 h-20 rounded-full bg-naija-green/20 flex items-center justify-center"
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.3,
                  }}
                >
                  <motion.svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-naija-green"
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    />
                  </motion.svg>
                </motion.div>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-semibold text-naija-green"
                >
                  {message}
                </motion.p>
              </motion.div>
            </motion.div>
          </Sparkles>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const useSuccessAnimation = () => {
  const [show, setShow] = useState(false);

  const trigger = (message?: string, duration?: number) => {
    setShow(true);
    setTimeout(() => setShow(false), duration || 2000);
  };

  return { show, trigger, setShow };
};
