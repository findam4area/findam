/**
 * Not Found page for Listing Detail
 * 
 * Displayed when a listing cannot be found or the user doesn't have permission to view it.
 * Provides helpful navigation options.
 */

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function ListingNotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-gray-400">
            The listing you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Link
            href="/browse"
            className="flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            <Search className="w-5 h-5" />
            <span>Browse All Listings</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            <Home className="w-5 h-5" />
            <span>Go to Homepage</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 w-full text-gray-400 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
