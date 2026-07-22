'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Settings,
  Bell,
  Search,
  Menu,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ChevronDown
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import { formatRelativeTime } from "@/utils/formatRelativeTime";



interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const { user } = useAuth();
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    removeNotification,
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
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // Derive page name from route path
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
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
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 lg:px-8 border-b border-white/10 bg-surface/60 backdrop-blur-xl">

      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-white/5 lg:hidden text-on-surface-variant"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-on-surface leading-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-on-surface-variant mt-0.5 font-medium">
            Welcome back, {profile?.displayName || "User"}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Search Bar - hidden on tiny screens */}
        {/* <div className="relative hidden md:block max-w-xs w-60">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full h-10 pl-10 pr-4 text-sm font-medium border border-white/5 bg-surface-container-lowest rounded-xl text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-pf-primary focus:border-transparent transition-all"
          />
        </div> */}

        {/* Theme Toggle Button */}
        {/* <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-white/5 text-on-surface-variant border border-white/10 shadow-sm transition-all"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-tertiary fill-tertiary/20" />
          ) : (
            <Moon className="h-5 w-5 text-pf-primary" />
          )}
        </button> */}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              const opening = !showNotifications;

              setShowNotifications(opening);

              if (opening) {
                clearNotifications()
              }
            }}
            className="relative p-2.5 rounded-xl hover:bg-white/5 text-on-surface-variant border border-white/10 shadow-sm transition-all"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6 shrink-0" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 bg-surface-container border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">

              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-surface-container">
                <h3 className="font-semibold text-on-surface">
                  Notifications
                </h3>

                <button
                  onClick={clearNotifications}
                  className="text-xs text-pf-primary hover:underline"
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto">

                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant text-sm">
                    <div className="py-12 flex flex-col items-center">
                      <Bell className="w-10 h-10 text-on-surface-variant opacity-50 mb-3" />

                      <p className="font-medium text-on-surface">
                        You're all caught up
                      </p>

                      <p className="text-xs text-on-surface-variant mt-1">
                        New activity will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        group
                        flex
                        gap-4
                        px-5
                        py-4
                        mx-2
                        my-2
                        rounded-xl
                        transition-all
                        cursor-pointer
                        hover:bg-white/5
                        border-l-4
                        ${notification.type === "success"
                          ? "border-green-500"
                          : notification.type === "warning"
                            ? "border-yellow-500"
                            : "border-blue-500"
                        }
`}
                    >
                      <div className="mt-1">

                        {notification.type === "success" && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}

                        {notification.type === "warning" && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}

                        {notification.type === "info" && (
                          <ArrowDownLeft className="h-5 w-5 text-blue-500" />
                        )}
                      </div>

                      <div className="flex-1">

                        <div className="font-semibold text-sm text-on-surface">
                          {notification.title}
                        </div>

                        <div className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                          {notification.message}
                        </div>

                        {notification.amount !== undefined && (
                          <div
                            className={`mt-2 text-sm font-semibold ${notification.type === "success"
                              ? "text-green-500"
                              : "text-red-400"
                              }`}
                          >
                            {notification.type === "success"
                              ? "+"
                              : "-"}
                            {notification.amount.toLocaleString()}
                          </div>
                        )}

                        <div className="mt-2 text-[11px] text-on-surface-variant">
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
          className="p-2.5 rounded-xl hover:bg-white/5 text-on-surface-variant border border-white/10 shadow-sm transition-all"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <div className="w-[1px] h-8 bg-white/10 mx-1 hidden sm:block" />

        {/* User Profile avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-pf-primary/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-pf-primary/20 text-pf-primary font-bold text-xs flex items-center justify-center">
                {profile?.displayName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"}
              </div>
            )}
            <ChevronDown className="h-4 w-4 text-on-surface-variant" />
          </button>

          {showProfileMenu && (
            <>
              <div
                onClick={() => setShowProfileMenu(false)}
                className="fixed inset-0 z-30"
              />
              <div className="absolute right-0 mt-2 z-40 w-56 bg-surface-container border border-white/10 rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2.5 border-b border-white/10 mb-1.5">
                  <p className="text-sm font-bold text-on-surface truncate">{profile?.displayName}</p>
                  <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{profile?.email}</p>
                </div>
                <div className="text-xs text-on-surface-variant px-3 py-1 font-semibold tracking-wider uppercase">
                  Currency ($)
                </div>

                <div className="px-3 py-1.5 text-sm font-bold text-on-surface">
                  {profile?.currency} ($)
                </div>

                <div className="my-2 border-t border-white/10" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}