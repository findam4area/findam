/**
 * Footer Server Component
 * 
 * Site footer with:
 * - 4 columns: About, Categories, For Vendors, Legal
 * - Social media links (Twitter, Instagram, Facebook)
 * - Copyright notice with current year
 * - Mobile-first design (stacked columns on mobile)
 * - Accessible styling with proper contrast
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { getTopLevelCategories } from "@/lib/services/database";

export async function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Fetch categories for footer links
  const categories = await getTopLevelCategories();
  const displayCategories = categories?.slice(0, 6) || [];

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About Column - Requirement 7.1 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">About</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories Column - Requirement 7.2 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
            {displayCategories.length > 0 ? (
              <ul className="space-y-3">
                {displayCategories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/categories"
                    className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium"
                  >
                    View All →
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/categories"
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    Browse All
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* For Vendors Column - Requirement 7.3 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">For Vendors</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/vendor/apply"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Create Listing
                </Link>
              </li>
              <li>
                <Link
                  href="/inventory"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  My Listings
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column - Requirement 7.4 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-800" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Copyright - Requirement 7.5 */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Logo variant="compact" linkTo="/" />
            <p className="text-sm text-gray-500">
              © {currentYear} FindAm. All rights reserved.
            </p>
          </div>

          {/* Social Media Links - Requirement 7.6 */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/findam"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label="Follow us on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/findam"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://facebook.com/findam"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="mailto:hello@findam.ng"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label="Email us"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
