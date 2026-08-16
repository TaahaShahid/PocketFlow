'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, Bell, Menu, CheckCircle2, AlertTriangle, ArrowDownLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { profile, user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    clearNotifications,
  } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive page name from route path
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/transactions':
        return 'Transactions';
      case '/wallet':
        return 'Wallet & Cards';
      case '/goals':
        return 'Savings Goals';
      case '/analytics':
        return 'Financial Analytics';
      case '/reports':
        return 'Export Reports';
      default:
        return 'PocketFlow';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 lg:px-8 border-b border-border bg-card/60 backdrop-blur-xl">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-muted/10 lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 font-medium">
            Welcome back, {profile?.displayName || "User"}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              const opening = !showNotifications;
              setShowNotifications(opening);
              if (opening) {
                clearNotifications();
              }
            }}
            className="relative p-2.5 rounded-xl hover:bg-muted/15 text-muted-foreground hover:text-foreground border border-border shadow-sm transition-all"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 shrink-0" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold px-1 animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 bg-card/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">
                  Notifications
                </h3>
                <button
                  onClick={clearNotifications}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center">
                      <Bell className="w-10 h-10 text-muted-foreground opacity-40 mb-3" />
                      <p className="font-medium text-foreground">
                        You&apos;re all caught up
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        New activity will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "group flex gap-4 px-5 py-4 mx-2 my-2 rounded-xl transition-all cursor-pointer hover:bg-muted/10 border-l-4",
                        notification.type === "success"
                          ? "border-green-500 bg-green-500/5"
                          : notification.type === "warning"
                            ? "border-yellow-500 bg-yellow-500/5"
                            : "border-primary bg-primary/5"
                      )}
                    >
                      <div className="mt-1">
                        {notification.type === "success" && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {notification.type === "warning" && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        {notification.type === "info" && (
                          <ArrowDownLeft className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground">
                          {notification.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {notification.message}
                        </div>
                        {notification.amount !== undefined && (
                          <div
                            className={cn(
                              "mt-2 text-sm font-semibold",
                              notification.type === "success" ? "text-green-500" : "text-destructive"
                            )}
                          >
                            {notification.type === "success" ? "+" : "-"}
                            ${notification.amount.toLocaleString()}
                          </div>
                        )}
                        <div className="mt-2 text-[10px] text-muted-foreground">
                          {formatRelativeTime(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <Link
          href="/settings"
          className="p-2.5 rounded-xl hover:bg-muted/15 text-muted-foreground hover:text-foreground border border-border shadow-sm transition-all"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <div className="w-[1px] h-6 bg-border mx-1 hidden sm:block" />

        {/* User Profile avatar dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/10 transition-all border border-transparent hover:border-border"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/25 text-primary font-bold text-xs flex items-center justify-center shadow-inner">
                {getInitials()}
              </div>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 z-40 w-56 bg-card/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2.5 border-b border-border mb-1.5">
                <p className="text-sm font-bold text-foreground truncate">{profile?.displayName || "PocketFlow User"}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{profile?.email || user?.email}</p>
              </div>
              <div className="text-[10px] text-muted-foreground px-3 py-1.5 font-bold tracking-wider uppercase">
                Currency
              </div>
              <div className="px-3 pb-2 text-sm font-bold text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {profile?.currency || "USD"} ($)
              </div>

              <div className="my-1 border-t border-border" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}