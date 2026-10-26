import { CheckCircle2, Shield, Video, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  type: "phone" | "nin" | "video" | "premium" | "trusted";
  className?: string;
  showLabel?: boolean;
}

export function VerificationBadge({
  type,
  className,
  showLabel = false,
}: VerificationBadgeProps) {
  const badges = {
    phone: {
      icon: Phone,
      label: "Phone Verified",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    nin: {
      icon: Shield,
      label: "NIN Verified",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    video: {
      icon: Video,
      label: "Video Verified",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    premium: {
      icon: CheckCircle2,
      label: "Premium",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
    trusted: {
      icon: Shield,
      label: "100% Trusted",
      color: "text-naija-green",
      bgColor: "bg-naija-green/10",
    },
  };

  const badge = badges[type];
  const Icon = badge.icon;

  if (showLabel) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          badge.bgColor,
          badge.color,
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{badge.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1",
        badge.bgColor,
        className,
      )}
      title={badge.label}
    >
      <Icon className={cn("h-4 w-4", badge.color)} />
    </div>
  );
}

interface VerificationBadgesProps {
  phoneVerified: boolean;
  ninVerified: boolean;
  videoVerified: boolean;
  isPremium: boolean;
  className?: string;
  showLabels?: boolean;
}

export function VerificationBadges({
  phoneVerified,
  ninVerified,
  videoVerified,
  isPremium,
  className,
  showLabels = false,
}: VerificationBadgesProps) {
  const isTrusted = phoneVerified && ninVerified && videoVerified;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {isTrusted ? (
        <VerificationBadge type="trusted" showLabel={showLabels} />
      ) : (
        <>
          {phoneVerified && (
            <VerificationBadge type="phone" showLabel={showLabels} />
          )}
          {ninVerified && (
            <VerificationBadge type="nin" showLabel={showLabels} />
          )}
          {videoVerified && (
            <VerificationBadge type="video" showLabel={showLabels} />
          )}
        </>
      )}
      {isPremium && <VerificationBadge type="premium" showLabel={showLabels} />}
    </div>
  );
}
