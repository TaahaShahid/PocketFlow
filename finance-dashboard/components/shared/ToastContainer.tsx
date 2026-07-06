'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFinanceStore } from '../../hooks/useFinanceStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useFinanceStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgClass = 'bg-white dark:bg-jm-navy border-slate-200 dark:border-jm-dark-blue';
          let icon = <Info className="h-5 w-5 text-blue-500" />;
          
          if (toast.type === 'success') {
            bgClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50';
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50';
            icon = <AlertCircle className="h-5 w-5 text-rose-500" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-start gap-3 p-4 border rounded-xl shadow-lg pointer-events-auto ${bgClass}`}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
