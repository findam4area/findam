import { Suspense } from "react";
import { SavedListingsContent } from "./saved-listings-content";

export const metadata = {
  title: "Saved Listings | FindAm",
  description: "View your saved listings on FindAm",
};

export default function SavedListingsPage() {
  return (
    <div className="min-h-screen bg-dark-bg py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <svg
              className="w-8 h-8 text-naija-green"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved Listings
          </h1>
          <p className="text-gray-400">
            Your collection of saved items and services
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="glass-card rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-dark-card" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-dark-card rounded" />
                    <div className="h-8 bg-dark-card rounded w-1/2" />
                    <div className="h-4 bg-dark-card rounded" />
                    <div className="h-4 bg-dark-card rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <SavedListingsContent />
        </Suspense>
      </div>
    </div>
  );
}
