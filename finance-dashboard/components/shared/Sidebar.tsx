'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowUpDown,
  Wallet,
  Target,
  PieChart,
  FileText,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Goals', href: '/goals', icon: Target },
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-white/10 bg-surface/60 backdrop-blur-xl shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Sidebar Header with Brand Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            {/* Geometric Brand Logo Symbol */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-pf-primary text-on-primary shadow-md shadow-pf-primary/20 transition-all duration-300 group-hover:scale-105">
              <span className="text-xl font-bold font-sans">J</span>
              <span className="text-xs font-bold font-sans self-end mb-1 ml-0.5 text-on-primary/70">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-on-surface leading-none">
                PocketFlow
              </span>
              <span className="text-[10px] font-semibold text-pf-primary mt-0.5 tracking-wider uppercase">
                Finance Hub
              </span>
            </div>
          </Link>

          {/* Close button for Mobile drawer */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 lg:hidden text-on-surface-variant"
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
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                  ? 'bg-pf-primary/10 text-pf-primary'
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                  }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive
                  ? 'text-pf-primary'
                  : 'text-on-surface-variant group-hover:text-pf-primary'
                  }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pf-primary/20 flex items-center justify-center text-pf-primary font-bold text-sm">
              TS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface truncate">
                Taaha Shahid
              </span>
              <span className="text-[10px] text-on-surface-variant truncate">
                taahashahid1@gmail.com
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}