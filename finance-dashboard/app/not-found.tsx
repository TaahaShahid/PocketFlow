'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">404 - Page Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        We are sorry, but the page you are looking for does not exist or has been moved.
      </p>
      <Link 
        href="/"
        className="mt-6 px-5 py-2.5 text-xs font-bold text-white bg-jm-dark-blue hover:bg-jm-light-blue rounded-xl shadow-md transition-all"
      >
        Go back to Dashboard
      </Link>
    </div>
  );
}
