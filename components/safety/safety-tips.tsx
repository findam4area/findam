"use client";

import { Shield, MapPin, CreditCard, Eye, AlertTriangle } from "lucide-react";

interface SafetyTipsProps {
  variant?: "compact" | "full";
}

const SAFETY_TIPS = [
  {
    icon: MapPin,
    title: "Meet in Public",
    description:
      "Always meet in a well-lit, public place like a shopping mall or police station.",
  },
  {
    icon: Eye,
    title: "Inspect Before Paying",
    description:
      "Thoroughly inspect the item and verify it matches the description before making payment.",
  },
  {
    icon: CreditCard,
    title: "Avoid Advance Payments",
    description:
      "Never send money or make advance payments before seeing the item in person.",
  },
  {
    icon: AlertTriangle,
    title: "Trust Your Instincts",
    description:
      "If something feels wrong or too good to be true, it probably is. Walk away.",
  },
];

export function SafetyTips({ variant = "full" }: SafetyTipsProps) {
  if (variant === "compact") {
    return (
      <div className="rounded-lg border border-naija-green/20 bg-naija-green/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5 text-naija-green" />
          <h4 className="font-semibold text-naija-green">Safety Tips</h4>
        </div>
        <ul className="space-y-1 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-naija-green">•</span>
            <span>Meet in a public place</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-naija-green">•</span>
            <span>Inspect item before paying</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-naija-green">•</span>
            <span>Never send money in advance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-naija-green">•</span>
            <span>Trust your instincts</span>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-naija-green/20 bg-naija-green/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-6 w-6 text-naija-green" />
        <h3 className="text-lg font-semibold text-naija-green">
          Stay Safe on FindAm
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SAFETY_TIPS.map((tip, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-naija-green/20">
                <tip.icon className="h-5 w-5 text-naija-green" />
              </div>
            </div>
            <div>
              <h4 className="mb-1 font-medium">{tip.title}</h4>
              <p className="text-sm text-muted-foreground">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
        <p className="text-sm text-yellow-200">
          <strong>Remember:</strong> FindAm will never ask you to send money
          outside the platform or share sensitive information via messages.
        </p>
      </div>
    </div>
  );
}
