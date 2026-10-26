"use client";

/**
 * NavigationBar Client Component
 * 
 * Main navigation bar with:
 * - Logo with link to homepage
 * - Search bar with Enter key submission
 * - User avatar and dropdown (authenticated)
 * - Login/Sign Up buttons (unauthenticated)
 * - Hamburger menu for mobile (<768px)
 * - Complete keyboard navigation
 * - Active route highlighting
 * - Sticky positioning
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types/core";
import { Logo } from "@/components/shared/logo";

interface NavigationBarProps {
  user: User | null;
}

export function NavigationBar({ user }: NavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      router.push(`/browse?search_query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/80">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo - Requirement 8.1 */}
            <Logo variant="compact" priority />

            {/* Search Bar - Requirement 8.2 (hidden on mobile) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-md"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary-500"
                  aria-label="Search listings"
                />
              </div>
            </form>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-4">
              {/* Navigation Links (hidden on mobile) */}
              <div className="hidden lg:flex items-center gap-1">
                <Link
                  href="/browse"
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    isActive("/browse")
                      ? "text-primary-400 bg-primary-500/10"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  )}
                >
                  Browse
                </Link>

                <Link
                  href="/categories"
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    isActive("/categories")
                      ? "text-primary-400 bg-primary-500/10"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  )}
                >
                  Categories
                </Link>
              </div>

              {/* User Section - Requirements 8.3, 8.4, 8.5 */}
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/create">
                    <Button size="sm" variant="neon">
                      Post Listing
                    </Button>
                  </Link>
                  <UserMenu user={user} />
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/login">
                    <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" variant="neon">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button - Requirement 8.6 */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="h-6 w-6 text-gray-300" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (visible on mobile only) */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary-500"
                aria-label="Search listings"
              />
            </div>
          </form>
        </nav>
      </header>

      {/* Mobile Menu - Requirements 8.6, 8.7, 8.8 */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
      />
    </>
  );
}
