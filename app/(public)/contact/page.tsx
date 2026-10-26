import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us - FindAm",
  description: "Get in touch with the FindAm team. we're here to help with any questions or concerns.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-300">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
            <a
              href="mailto:hello@findam.ng"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              hello@findam.ng
            </a>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Phone</h3>
            <a
              href="tel:+2341234567890"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              +234 123 456 7890
            </a>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
            <p className="text-gray-400">
              Lagos, Nigeria
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
