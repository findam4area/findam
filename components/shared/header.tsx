"use client";

import { NotificationBell } from "@/components/notifications";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Logo } from "./logo";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header 
      className="sticky top-0 z-40 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-lg"
      id="navigation"
      role="banner"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo variant="compact" linkTo="/feed" />

          {/* Desktop Navigation */}
          <nav 
            className="hidden md:flex items-center space-x-6"
            aria-label="Main navigation"
          >
            <Link
              href="/feed"
              className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
              aria-label="View feed"
            >
              Feed
            </Link>
            <Link
              href="/search"
              className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
              aria-label="Search marketplace"
            >
              Search
            </Link>
            <Link
              href="/messages"
              className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
              aria-label="View messages"
            >
              Messages
            </Link>
            <Link
              href="/profile"
              className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
              aria-label="View profile"
            >
              Profile
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4" role="group" aria-label="User actions">
            {/* Search Icon (Mobile) */}
            <Link
              href="/search"
              className="md:hidden p-2 rounded-full hover:bg-dark-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2"
              aria-label="Search marketplace"
            >
              <Search className="w-6 h-6 text-white" aria-hidden="true" />
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-dark-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2"
              aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-dark-border"
            id="mobile-menu"
          >
            <nav 
              className="flex flex-col space-y-4"
              aria-label="Mobile navigation"
            >
              <Link
                href="/feed"
                className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="View feed"
              >
                Feed
              </Link>
              <Link
                href="/search"
                className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Search marketplace"
              >
                Search
              </Link>
              <Link
                href="/messages"
                className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="View messages"
              >
                Messages
              </Link>
              <Link
                href="/profile"
                className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 rounded-lg px-3 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="View profile"
              >
                Profile
              </Link>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
