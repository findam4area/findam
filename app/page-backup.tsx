import { Suspense } from "next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FindAm - Find Services & Opportunities Across Nigeria",
  description: "Connect with verified vendors, discover local businesses, and find the perfect service for your needs.",
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white">FindAm</h1>
        <p className="text-gray-400 mt-4">Coming soon...</p>
      </div>
    </main>
  );
}
