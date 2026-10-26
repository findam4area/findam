"use client";

/**
 * ReferralTracker Component
 * Displays referral code, share options, statistics, and earned rewards
 * Requirements: 17.1, 17.2, 17.6
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Copy,
  Share2,
  MessageCircle,
  Twitter,
  Facebook,
  Mail,
  TrendingUp,
  Users,
  Wallet,
  Clock,
} from "lucide-react";

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingRewards: number;
  earnedRewards: number;
  monthlyCount: number;
  monthlyLimit: number;
}

interface ReferralTrackerProps {
  userId: string;
}

export function ReferralTracker({ userId }: ReferralTrackerProps) {
  const [referralCode, setReferralCode] = useState<string>("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, [userId]);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Fetch referral code
      const codeResponse = await fetch("/api/referrals/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        setReferralCode(codeData.code);
      }

      // Fetch stats
      const statsResponse = await fetch(`/api/referrals/stats?userId=${userId}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to load referral data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/register?ref=${referralCode}`;
  };

  const copyToClipboard = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(getReferralLink());
      toast.success("Referral link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    } finally {
      setCopying(false);
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Join FindAm using my referral code ${referralCode} and get ₦200 bonus! ${getReferralLink()}`,
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareViaTwitter = () => {
    const message = encodeURIComponent(
      `Join FindAm using my referral code ${referralCode} and get ₦200 bonus!`,
    );
    const url = encodeURIComponent(getReferralLink());
    window.open(
      `https://twitter.com/intent/tweet?text=${message}&url=${url}`,
      "_blank",
    );
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(getReferralLink());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
    );
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Join FindAm and Get ₦200 Bonus!");
    const body = encodeURIComponent(
      `Hi!\n\nI'm inviting you to join FindAm, Nigeria's best marketplace for buying and selling.\n\nUse my referral code ${referralCode} when signing up and you'll get ₦200 bonus in your wallet!\n\nSign up here: ${getReferralLink()}\n\nSee you there!`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join FindAm",
          text: `Use my referral code ${referralCode} and get ₦200 bonus!`,
          url: getReferralLink(),
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Referral Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <p className="text-sm text-muted-foreground">
            Share your code and earn ₦500 for each friend who signs up, plus
            ₦500 more when they make their first purchase!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code Display */}
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-lg font-bold"
            />
            <Button
              onClick={copyToClipboard}
              disabled={copying}
              variant="outline"
              size="icon"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Referral Link */}
          <div className="flex gap-2">
            <Input
              value={getReferralLink()}
              readOnly
              className="text-sm"
            />
            <Button
              onClick={handleShare}
              variant="outline"
              size="icon"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              onClick={shareViaWhatsApp}
              variant="outline"
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              onClick={shareViaTwitter}
              variant="outline"
              className="gap-2"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button
              onClick={shareViaFacebook}
              variant="outline"
              className="gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Referrals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Referrals
                  </p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Successful Referrals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Successful
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.successfulReferrals}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Rewards */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Rewards
                  </p>
                  <p className="text-2xl font-bold">
                    ₦{stats.pendingRewards.toLocaleString()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* Earned Rewards */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Earned Rewards
                  </p>
                  <p className="text-2xl font-bold">
                    ₦{stats.earnedRewards.toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Limit Info */}
      {stats && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Monthly Referrals
                </span>
                <span className="font-medium">
                  {stats.monthlyCount} / {stats.monthlyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${(stats.monthlyCount / stats.monthlyLimit) * 100}%`,
                  }}
                ></div>
              </div>
              {stats.monthlyCount >= stats.monthlyLimit && (
                <p className="text-sm text-orange-600">
                  You've reached your monthly referral limit. Limit resets next
                  month.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold">
                1
              </span>
              <span>
                Share your referral code with friends via WhatsApp, social
                media, or email
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold">
                2
              </span>
              <span>
                When they sign up using your code, you get ₦500 and they get
                ₦200
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold">
                3
              </span>
              <span>
                When they make their first purchase, you get an additional ₦500
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold">
                4
              </span>
              <span>
                You can refer up to 50 friends per month and earn up to ₦50,000
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
