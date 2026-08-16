'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowUpDown,
  Wallet,
  Target,
  PieChart,
  FileText,
  X,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/shared/ThemeProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const { user, profile } = useAuth();

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "US";
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
    { name: 'Wallet & Cards', href: '/wallet', icon: Wallet },
    { name: 'Savings Goals', href: '/goals', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Reports', href: '/reports', icon: FileText }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-border/30 bg-surface/65 backdrop-blur-xl shadow-sidebar-shadow transition-all duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Sidebar Header with Brand Logo or Toggle Icon */}
        <div className={cn(
          "flex items-center justify-between h-20 border-b border-border/30 px-6 transition-all duration-300",
          isCollapsed ? "lg:px-0 lg:justify-center" : ""
        )}>
          {isCollapsed ? (
            /* Collapsed State: Logo turns into PanelLeft toggle icon on hover */
            <button
              onClick={onToggleCollapse}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-transparent transition-all duration-300 hover:bg-muted/30 group cursor-pointer"
              title="Expand Sidebar"
            >
              {/* Logo badge display */}
              <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200">
                <img
                  src={theme === 'dark' ? '/B_LOGO.jpg' : '/W_LOGO.jpg'}
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-cover"
                />
              </div>
              {/* Collapse open panel icon display on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-on-surface">
                <PanelLeft className="h-5 w-5" />
              </div>
            </button>
          ) : (
            /* Expanded State: Logo & Brand Name on left, PanelLeftClose button on right */
            <div className="flex items-center justify-between w-full">
              <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
                <img
                  src={theme === 'dark' ? '/B_LOGO.jpg' : '/W_LOGO.jpg'}
                  alt="PocketFlow Logo"
                  className="w-10 h-10 rounded-xl object-cover shadow-sm transition-all duration-300 group-hover:scale-105"
                />
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-on-surface leading-none">
                    PocketFlow
                  </span>
                  <span className="text-[10px] font-semibold text-pf-primary mt-1 tracking-wider uppercase">
                    Finance Hub
                  </span>
                </div>
              </Link>

              {/* Toggle close button on desktop */}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Close button for Mobile drawer */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 lg:hidden text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors group",
                  isActive
                    ? "text-pf-primary"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
                  isCollapsed ? "lg:px-0 lg:justify-center" : ""
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {/* Active link sliding background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    className="absolute inset-0 bg-pf-primary/10 rounded-xl -z-10 border border-pf-primary/15"
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-pf-primary" : "text-on-surface-variant group-hover:text-on-surface"
                  )}
                />
                {!isCollapsed && <span className="animate-fade-in">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Account Details */}
        <div className={cn(
          "p-6 border-t border-border/30 transition-all duration-300",
          isCollapsed ? "lg:p-4 lg:flex lg:justify-center" : ""
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pf-primary/20 flex items-center justify-center text-pf-primary font-bold text-sm border border-pf-primary/20 shadow-inner shrink-0">
              {getInitials()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-fade-in">
                <span className="text-xs font-bold text-on-surface truncate">
                  {profile?.displayName || "PocketFlow User"}
                </span>
                <span className="text-[10px] text-on-surface-variant truncate">
                  {user?.email || "user@pocketflow.com"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}