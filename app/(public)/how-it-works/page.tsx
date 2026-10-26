import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, MessageCircle, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works - FindAm",
  description: "Learn how to use FindAm to find services, create listings, and connect with vendors across Nigeria.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up",
      description: "Create your free account in seconds. No credit card required.",
    },
    {
      icon: Search,
      title: "Browse or Post",
      description: "Search for services you need or create your own listing to offer services.",
    },
    {
      icon: MessageCircle,
      title: "Connect",
      description: "Contact vendors directly through phone or messaging to discuss details.",
    },
    {
      icon: CheckCircle,
      title: "Complete",
      description: "Finalize your transaction and leave feedback to help the community.",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            How FindAm Works
          </h1>
          <p className="text-xl text-gray-300">
            Getting started is easy. Follow these simple steps to find services or grow your business.
          </p>
        </div>

        <div className="space-y-12 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-primary-500/10 border-2 border-primary-500/30 flex items-center justify-center">
                  <step.icon className="h-8 w-8 text-primary-400" />
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/register">
            <Button size="lg" variant="neon">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
