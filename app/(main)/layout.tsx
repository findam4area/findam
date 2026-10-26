"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import { Header } from "@/components/shared";
import { NotificationToast } from "@/components/notifications";
import { ComparisonBar } from "@/components/comparison";
import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import { ErrorBoundary, PageErrorFallback } from "@/components/error";

const navItems = [
  { title: "Feed", icon: Home, href: "/feed" },
  { title: "Search", icon: Search, href: "/search" },
  { title: "Post", icon: PlusCircle, href: "/create" },
  { title: "Messages", icon: MessageCircle, href: "/messages" },
  { title: "Profile", icon: User, href: "/profile" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallback={PageErrorFallback}>
      <Header />
      <NotificationToast />
      <main id="main-content" className="pb-20 md:pb-0" tabIndex={-1}>
        {children}
      </main>
      <ComparisonBar />
      <FloatingDock items={navItems} />
    </ErrorBoundary>
  );
}
