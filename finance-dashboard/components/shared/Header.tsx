'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronDown
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useFinanceStore } from '../../hooks/useFinanceStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user } = useFinanceStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        return 'JM Solutionss';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 lg:px-8 border-b border-slate-200 dark:border-jm-dark-blue bg-white/80 dark:bg-jm-navy/80 backdrop-blur-md">

      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden text-slate-600 dark:text-slate-300"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Welcome back, {user.name}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Search Bar - hidden on tiny screens */}
        <div className="relative hidden md:block max-w-xs w-60">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full h-10 pl-10 pr-4 text-sm font-medium border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent dark:focus:ring-jm-light-blue transition-all"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-jm-dark-blue/40 shadow-sm transition-all"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon className="h-5 w-5 text-jm-dark-blue" />
          )}
        </button>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-jm-dark-blue/40 shadow-sm transition-all"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          </button>
        </div>

        {/* Settings button */}
        <button
          className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-jm-dark-blue/40 shadow-sm transition-all"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="w-[1px] h-8 bg-slate-200 dark:bg-jm-dark-blue/80 mx-1 hidden sm:block" />

        {/* User Profile avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-100 dark:hover:border-jm-dark-blue/40"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-jm-dark-blue/10 dark:ring-jm-light-blue/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-jm-dark-blue/10 dark:bg-jm-light-blue/20 text-jm-dark-blue dark:text-jm-light-blue font-bold text-xs flex items-center justify-center">
                JS
              </div>
            )}
            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </button>

          {showProfileMenu && (
            <>
              <div
                onClick={() => setShowProfileMenu(false)}
                className="fixed inset-0 z-30"
              />
              <div className="absolute right-0 mt-2 z-40 w-56 bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-jm-dark-blue mb-1.5">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
                <div className="text-xs text-slate-400 px-3 py-1 font-semibold tracking-wider uppercase">Currency</div>
                <div className="px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {user.currency} ($)
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
