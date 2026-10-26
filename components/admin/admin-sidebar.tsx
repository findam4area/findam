/**
 * Admin Sidebar Navigation Component
 * 
 * Client Component providing:
 * - Sidebar navigation with pending count badges
 * - Mobile-responsive design with collapsible menu
 * - Active route highlighting
 * - Keyboard navigation support
 * 
 * Requirements: 3.2, 4.3
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Menu, 
  X,
  Home
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  pendingListingsCount: number;
  pendingVendorsCount: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function AdminSidebar({
  pendingListingsCount,
  pendingVendorsCount,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items configuration
  const navItems: NavItem[] = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/listings',
      label: 'Pending Listings',
      icon: FileText,
      badge: pendingListingsCount,
    },
    {
      href: '/admin/vendors',
      label: 'Pending Vendors',
      icon: Users,
      badge: pendingVendorsCount,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button - fixed top left */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        </div>
        
        {/* Back to site link */}
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Back to site</span>
        </Link>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - slides in on mobile, fixed on desktop */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Sidebar header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">FindAm Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Management Dashboard</p>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-2" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`
                  flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-700' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                
                {/* Pending count badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto"
                    aria-label={`${item.badge} pending`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer - back to site link on desktop */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 hidden lg:block">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Back to site</span>
          </Link>
        </div>
      </aside>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" aria-hidden="true" />
    </>
  );
}
