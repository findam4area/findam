import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Shield, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - FindAm",
  description: "Learn about FindAm's mission to connect young Nigerians with services, opportunities, and businesses across the country.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          About FindAm
        </h1>
        <p className="text-xl text-gray-300">
          Connecting young Nigerians with services, opportunities, and businesses they can trust.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 lg:p-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            FindAm is a youth-centric curated directory platform designed to help young Nigerians discover 
            and connect with verified vendors, local businesses, and service providers across the country.
          </p>
          <p className="text-gray-300 leading-relaxed">
            We believe in making it easier for people to find reliable services—from tech and fashion to 
            food and freelancing—all in one trusted platform.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-2xl lg:text-3xl font-bold text-white text-center mb-12">
          Why Choose FindAm?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="h-12 w-12 rounded-lg bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Verified Vendors</h3>
            <p className="text-gray-400">
              All vendors are carefully vetted to ensure you connect with trustworthy businesses.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="h-12 w-12 rounded-lg bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Local Communities</h3>
            <p className="text-gray-400">
              Find services and opportunities in your local area across Nigeria.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="h-12 w-12 rounded-lg bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Curated Listings</h3>
            <p className="text-gray-400">
              Every listing is manually reviewed to maintain quality and authenticity.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-xl p-8 lg:p-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-300 mb-8">
            Join thousands of Nigerians discovering services and opportunities on FindAm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="neon">
                Sign Up Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
