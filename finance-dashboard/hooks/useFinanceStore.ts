'use client';

import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface FinanceStore {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

// Pre-defined categories helper
export const CATEGORIES = {
  income: [
    { name: 'Salary', icon: 'Briefcase', color: '#10B981' },
    { name: 'Investments', icon: 'TrendingUp', color: '#3B82F6' },
    { name: 'Consulting', icon: 'Award', color: '#8B5CF6' },
    { name: 'Freelance', icon: 'Laptop', color: '#F59E0B' },
    { name: 'Other Income', icon: 'PlusCircle', color: '#6B7280' }
  ],
  expense: [
    { name: 'Housing', icon: 'Home', color: '#EF4444' },
    { name: 'Food & Dining', icon: 'Utensils', color: '#F59E0B' },
    { name: 'Transportation', icon: 'Car', color: '#3B82F6' },
    { name: 'Entertainment', icon: 'Tv', color: '#8B5CF6' },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899' },
    { name: 'Utilities', icon: 'Zap', color: '#10B981' },
    { name: 'Healthcare', icon: 'Activity', color: '#14B8A6' },
    { name: 'Education', icon: 'BookOpen', color: '#6366F1' },
    { name: 'Other Expense', icon: 'MinusCircle', color: '#6B7280' }
  ]
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  toasts: [],

  // Toasts management
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}));
