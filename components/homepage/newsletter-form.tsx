"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

interface NewsletterFormProps {
  className?: string;
}

export function NewsletterForm({ className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setErrorMessage("");
    
    // Validate email format
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setStatus("error");
      setErrorMessage(validation.error.errors[0].message);
      return;
    }

    setStatus("loading");

    try {
      // TODO: Implement actual newsletter subscription API call
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setStatus("success");
      setEmail("");
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    } catch (error) {
      setStatus("error");
      setErrorMessage("Failed to subscribe. Please try again.");
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") {
                setStatus("idle");
                setErrorMessage("");
              }
            }}
            placeholder="Enter your email"
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-naija-green focus:border-transparent transition-all min-h-[44px]"
            disabled={status === "loading" || status === "success"}
            aria-label="Email address"
            aria-describedby={status === "error" ? "email-error" : undefined}
          />
        </div>

        <Button
          type="submit"
          variant="neon"
          className="w-full min-h-[44px]"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Subscribing...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Subscribed!
            </>
          ) : (
            <>
              <Mail className="mr-2 h-5 w-5" />
              Subscribe
            </>
          )}
        </Button>
      </form>

      <AnimatePresence mode="wait">
        {status === "error" && errorMessage && (
          <motion.div
            id="email-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-3 text-red-400 text-sm"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-3 text-naija-green text-sm"
            role="status"
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>Thanks for subscribing! Check your inbox.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
