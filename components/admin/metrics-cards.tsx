import {
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Crown,
  UserX,
} from "lucide-react";
import type { AdminStats } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface MetricsCardsProps {
  stats: AdminStats | null;
}

export function MetricsCards({ stats }: MetricsCardsProps) {
  if (!stats) {
    return null;
  }

  const metrics = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.activeUsers} active`,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Listings",
      value: stats.totalListings.toLocaleString(),
      subtitle: `${stats.activeListings} active`,
      icon: FileText,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      subtitle: "All time",
      icon: DollarSign,
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports.toLocaleString(),
      subtitle: "Needs review",
      icon: AlertTriangle,
      color: "from-red-500 to-pink-500",
    },
    {
      title: "Premium Users",
      value: stats.premiumUsers.toLocaleString(),
      subtitle: "Active subscriptions",
      icon: Crown,
      color: "from-purple-500 to-indigo-500",
    },
    {
      title: "Suspended Users",
      value: stats.suspendedUsers.toLocaleString(),
      subtitle: "Banned accounts",
      icon: UserX,
      color: "from-gray-500 to-slate-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.title}
            className="glass-card rounded-lg border border-dark-border bg-dark-card p-6 hover:border-naija-green/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {metric.title}
                </p>
                <h3 className="text-2xl font-bold text-white mt-2">
                  {metric.value}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
              </div>
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${metric.color} bg-opacity-10`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
