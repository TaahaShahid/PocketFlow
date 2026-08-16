'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './ToastContainer';
import { cn } from '@/lib/utils';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background font-sans antialiased text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Panel */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          isCollapsed={sidebarCollapsed}
        />

        {/* Page Content viewport */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Notifications system */}
      <ToastContainer />
    </div>
  );
}
