"use client";

/**
 * MobileMenu Client Component
 * 
 * Mobile navigation menu with:
 * - Navigation links
 * - User section (authenticated)
 * - Login/Sign Up buttons (unauthenticated)
 * - Close button with animation
 * - Click outside to close
 * - Keyboard navigation (Escape to close)
 * - Mobile-optimized touch targets (44x44px)
 * 
 * Requirements: 8.6, 8.7
 */

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Home, Grid, Search, User, FileText, LogOut, LogIn, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { logoutAction } from "@/lib/actions/auth-actions";
import { toastSuccess, toastError } from "@/lib/utils/toast";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/lib/types/core";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

export function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const router = useRouter();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      toastSuccess("Logged out successfully", "See you soon!");
      onClose();
    } catch (error) {
      toastError("Failed to log out", "Please try again.");
      console.error("Logout error:", error);
    }
  };

  const handleLinkClick = () => {
    onClose();
  };

  // Get user initials
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-gray-900 border-l border-gray-800 z-50",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Section (Authenticated) */}
          {user && (
            <>
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                  <Avatar className="h-12 w-12 border-2 border-gray-700">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                    <AvatarFallback className="bg-primary-600 text-white font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <Separator className="bg-gray-800" />
            </>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </Link>

            <Link
              href="/browse"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              <Search className="h-5 w-5" />
              <span className="font-medium">Browse</span>
            </Link>

            <Link
              href="/categories"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              <Grid className="h-5 w-5" />
              <span className="font-medium">Categories</span>
            </Link>
          </nav>

          <Separator className="bg-gray-800" />

          {/* User-specific Links (Authenticated) */}
          {user && (
            <>
              <nav className="p-4 space-y-1">
                <Link
                  href="/profile"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors min-h-[44px]"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </Link>

                <Link
                  href="/inventory"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors min-h-[44px]"
                >
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">My Listings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors min-h-[44px]"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Log out</span>
                </button>
              </nav>
            </>
          )}

          {/* Auth Buttons (Unauthenticated) */}
          {!user && (
            <div className="p-4 space-y-3">
              <Link href="/login" onClick={handleLinkClick} className="block">
                <Button variant="neon" className="w-full min-h-[44px] justify-start">
                  <LogIn className="mr-3 h-5 w-5" />
                  Log In
                </Button>
              </Link>

              <Link href="/register" onClick={handleLinkClick} className="block">
                <Button variant="outline" className="w-full min-h-[44px] justify-start">
                  <UserPlus className="mr-3 h-5 w-5" />
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
