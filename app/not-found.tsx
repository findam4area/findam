import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

/**
 * Root Not Found Page (404)
 * 
 * Displayed when a page cannot be found anywhere in the application.
 * Provides helpful navigation options to guide users back.
 * 
 * This is a Server Component (no 'use client' directive).
 * 
 * Requirements: 1.4, 15.7
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 Illustration */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-[#00ff41]/20 blur-3xl rounded-full" />
            
            {/* 404 Number */}
            <div className="relative">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-[#00ff41] to-[#00cc33] bg-clip-text text-transparent">
                404
              </h1>
            </div>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        {/* Heading and Description */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Page Not Found</h2>
          <p className="text-gray-400">
            Sorry, we couldn't find the page you're looking for. It may have been
            moved or doesn't exist.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#00ff41] to-[#00cc33] hover:from-[#00cc33] hover:to-[#00ff41] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ff41] focus:ring-offset-2 focus:ring-offset-gray-950 min-h-[44px]"
          >
            <Home className="w-5 h-5" />
            <span>Go to Homepage</span>
          </Link>

          <Link
            href="/browse"
            className="flex items-center justify-center gap-2 w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950 min-h-[44px]"
          >
            <Search className="w-5 h-5" />
            <span>Browse Listings</span>
          </Link>

          <Link
            href="/categories"
            className="flex items-center justify-center gap-2 w-full text-gray-400 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Explore Categories</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
