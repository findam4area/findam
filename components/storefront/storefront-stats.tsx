import { Calendar, TrendingUp, Clock } from "lucide-react";
import type { User } from "@/lib/types";

interface StorefrontStatsProps {
  stats: {
    totalSales: number;
    responseTime: string;
    memberSince: string;
    followerCount: number;
    averageRating: number;
    reviewCount: number;
  };
  seller: User;
}

export function StorefrontStats({ stats, seller }: StorefrontStatsProps) {
  const memberSinceDate = new Date(stats.memberSince);
  const formattedDate = memberSinceDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalSales}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-3">
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Response Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.responseTime}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-3">
            <Calendar className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="text-lg font-bold text-gray-900">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
