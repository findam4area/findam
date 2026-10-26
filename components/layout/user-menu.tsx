"use client";

/**
 * UserMenu Client Component
 * 
 * Dropdown menu for authenticated users with:
 * - User avatar and name
 * - Navigation links (My Listings, Profile)
 * - Logout functionality
 * - Keyboard navigation support
 * 
 * Requirements: 8.3, 8.4, 8.5
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, FileText, Settings, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth-actions";
import { toastSuccess, toastError } from "@/lib/utils/toast";
import type { User as UserType } from "@/lib/types/core";

interface UserMenuProps {
  user: UserType;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutAction();
      toastSuccess("Logged out successfully", "See you soon!");
    } catch (error) {
      setIsLoggingOut(false);
      toastError("Failed to log out", "Please try again.");
      console.error("Logout error:", error);
    }
  };

  // Get user initials for avatar fallback
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full">
        <Avatar className="h-10 w-10 border-2 border-gray-700 hover:border-primary-500 transition-colors cursor-pointer">
          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
          <AvatarFallback className="bg-primary-600 text-white font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/inventory" className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>My Listings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/notifications/preferences" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
