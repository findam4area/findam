"use client";

/**
 * ReferralLeaderboard Component
 * Shows top referrers with monthly prizes
 * Requirements: 17.10
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { toast } from "sonner";

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string | null;
  referralCount: number;
  rank: number;
}

interface ReferralLeaderboardProps {
  limit?: number;
  month?: string; // Format: YYYY-MM
}

export function ReferralLeaderboard({
  limit = 100,
  month,
}: ReferralLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [limit, month]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (month) {
        params.append("month", month);
      }

      const response = await fetch(`/api/referrals/leaderboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      } else {
        toast.error("Failed to load leaderboard");
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">1st Place</Badge>
        );
      case 2:
        return (
          <Badge className="bg-gray-400 hover:bg-gray-500">2nd Place</Badge>
        );
      case 3:
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700">3rd Place</Badge>
        );
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  const getPrizeInfo = (rank: number) => {
    switch (rank) {
      case 1:
        return "₦50,000 Prize";
      case 2:
        return "₦30,000 Prize";
      case 3:
        return "₦20,000 Prize";
      default:
        if (rank <= 10) {
          return "₦5,000 Prize";
        }
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Referral Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top referrers this month win amazing prizes!
        </p>
      </CardHeader>
      <CardContent>
        {/* Prize Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold mb-2">Monthly Prizes</h3>
          <ul className="text-sm space-y-1">
            <li className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>1st Place: ₦50,000</span>
            </li>
            <li className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-gray-400" />
              <span>2nd Place: ₦30,000</span>
            </li>
            <li className="flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-600" />
              <span>3rd Place: ₦20,000</span>
            </li>
            <li className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-500" />
              <span>4th-10th Place: ₦5,000 each</span>
            </li>
          </ul>
        </div>

        {/* Leaderboard List */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No referrals yet this month</p>
            <p className="text-sm">Be the first to start referring!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.rank <= 3
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {getRankIcon(entry.rank) || (
                    <span className="text-lg font-bold text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatar || undefined} />
                  <AvatarFallback>
                    {entry.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entry.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.referralCount} referral
                    {entry.referralCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Badge & Prize */}
                <div className="flex-shrink-0 text-right">
                  {getRankBadge(entry.rank)}
                  {getPrizeInfo(entry.rank) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getPrizeInfo(entry.rank)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Leaderboard resets monthly. Prizes are
            awarded on the 1st of each month to the previous month's winners.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
