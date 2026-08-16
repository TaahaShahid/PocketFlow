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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-border bg-card/65 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header with Brand Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            {/* Premium Logo Symbol */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/30">
              <span className="text-xl font-bold font-sans tracking-tight">P</span>
              <span className="absolute bottom-0.5 right-1.5 text-[9px] font-bold opacity-75">F</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground leading-none">
                PocketFlow
              </span>
              <span className="text-[10px] font-semibold text-primary mt-1 tracking-wider uppercase">
                Finance Hub
              </span>
            </div>
          </Link>

          {/* Close button for Mobile drawer */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/10 lg:hidden text-muted-foreground hover:text-foreground transition-colors"
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
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted/5 hover:text-foreground"
                )}
              >
                {/* Active link sliding background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-10 border border-primary/15"
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Account Details */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 shadow-inner">
              {getInitials()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground truncate">
                {profile?.displayName || "PocketFlow User"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {user?.email || "user@pocketflow.com"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}