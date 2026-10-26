"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * InstallPrompt Component
 * Displays a prompt for users to install the PWA on their home screen
 * 
 * Requirements: 17.6
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const checkStandalone = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      );
    };

    setIsStandalone(checkStandalone());

    // Check if iOS
    const checkIOS = () => {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream
      );
    };

    setIsIOS(checkIOS());

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-install-prompt-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Only show again after 7 days
      if (dismissedDate > sevenDaysAgo) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after 30 seconds of browsing
      setTimeout(() => {
        if (!checkStandalone()) {
          setShowPrompt(true);
        }
      }, 30000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show iOS prompt if applicable
    if (checkIOS() && !checkStandalone()) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Track dismissal
    localStorage.setItem(
      "pwa-install-prompt-dismissed",
      new Date().toISOString()
    );
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(
      "pwa-install-prompt-dismissed",
      new Date().toISOString()
    );
  };

  // Don&apos;t show if already installed or not applicable
  if (isStandalone || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
          role="dialog"
          aria-labelledby="install-prompt-title"
          aria-describedby="install-prompt-description"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3
                    id="install-prompt-title"
                    className="font-semibold text-gray-900 dark:text-white"
                  >
                    Install FindAm
                  </h3>
                  <p
                    id="install-prompt-description"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {isIOS
                      ? "Add to your home screen"
                      : "Install for quick access"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                <p>To install this app:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Tap the Share button in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get faster access and use FindAm offline!
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <li>✓ Instant loading</li>
                  <li>✓ Work offline</li>
                  <li>✓ Push notifications</li>
                </ul>
              </div>
            )}

            {!isIOS && (
              <Button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to programmatically trigger install prompt
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);

    return choiceResult.outcome === "accepted";
  };

  return {
    isInstallable,
    promptInstall,
  };
}
