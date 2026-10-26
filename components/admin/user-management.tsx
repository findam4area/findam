"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ban, CheckCircle, Search, Crown, Shield } from "lucide-react";
import type { AdminUser, PaginatedResponse } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    is_premium: null as boolean | null,
    is_suspended: null as boolean | null,
    phone_verified: null as boolean | null,
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, page]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (searchQuery) params.append("search_query", searchQuery);
      if (filters.is_premium !== null)
        params.append("is_premium", filters.is_premium.toString());
      if (filters.is_suspended !== null)
        params.append("is_suspended", filters.is_suspended.toString());
      if (filters.phone_verified !== null)
        params.append("phone_verified", filters.phone_verified.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: PaginatedResponse<AdminUser> = await response.json();
        setUsers(data.data);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (userId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_suspended: suspend }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filters.is_premium === true ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilters({
                ...filters,
                is_premium: filters.is_premium === true ? null : true,
              });
              setPage(0);
            }}
          >
            <Crown className="h-4 w-4 mr-1" />
            Premium
          </Button>
          <Button
            variant={filters.is_suspended === true ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilters({
                ...filters,
                is_suspended: filters.is_suspended === true ? null : true,
              });
              setPage(0);
            }}
          >
            <Ban className="h-4 w-4 mr-1" />
            Suspended
          </Button>
          <Button
            variant={filters.phone_verified === true ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilters({
                ...filters,
                phone_verified: filters.phone_verified === true ? null : true,
              });
              setPage(0);
            }}
          >
            <Shield className="h-4 w-4 mr-1" />
            Verified
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-white">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No users found</div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Trust Score
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Listings
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Joined
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-dark-border hover:bg-dark-card/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-naija-green to-neon-cyan flex items-center justify-center text-white font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.username}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium">
                          {user.trust_score}
                        </div>
                        {user.phone_verified && (
                          <CheckCircle className="h-4 w-4 text-naija-green" />
                        )}
                        {user.is_premium && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">
                        {user.active_listings_count} / {user.listings_count}
                      </div>
                      <div className="text-xs text-gray-400">
                        active / total
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_suspended ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user.is_suspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSuspend(user.id, false)}
                        >
                          Unsuspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSuspend(user.id, true)}
                        >
                          Suspend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={() => setPage(page + 1)} variant="outline">
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
