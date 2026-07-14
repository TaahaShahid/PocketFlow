'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFinanceStore, CATEGORIES } from '../../../hooks/useFinanceStore';
import { useTransactions } from '@/context/TransactionContext';
import { useWallets } from '@/context/WalletContext';
import { Transaction, TransactionType, TransactionStatus } from '../../../types';
import { Loader2 } from 'lucide-react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Filter,
  Tag,
  Wallet,
  ArrowUpDown,
  AlertTriangle,
  Download,
  Sparkles,
  TrendingUp,
  X,
  Utensils,
  ShoppingBag,
  Car,
  Film,
  CreditCard,
  DollarSign,
  type LucideIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';

// Maps a category name to a merchant icon for the transaction row/card avatar.
function getCategoryIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (/food|dining|restaurant|grocery/.test(c)) return Utensils;
  if (/shop|retail|cloth/.test(c)) return ShoppingBag;
  if (/transport|gas|car|fuel|uber/.test(c)) return Car;
  if (/entertain|movie|stream|game/.test(c)) return Film;
  if (/salary|income|freelance|consult/.test(c)) return DollarSign;
  return CreditCard;
}

// Maps a transaction status to the dot/text treatment used in the Status column.
function getStatusVisual(status: string): { dot: string; text: string; label: string } {
  const s = status.toLowerCase();
  if (s === 'completed') return { dot: 'bg-pf-primary', text: 'text-pf-primary', label: 'Completed' };
  if (s === 'pending') return { dot: 'bg-on-surface-variant/40', text: 'text-on-surface-variant', label: 'Pending' };
  return { dot: 'bg-error', text: 'text-error', label: status.charAt(0).toUpperCase() + status.slice(1) };
}

const cardBase = 'glass-panel rounded-2xl';

export default function TransactionsPage() {
  const { transactions, addTransaction, editTransaction, deleteTransaction, loading: txLoading } = useTransactions();
  const { wallets: cards, loading: walletsLoading } = useWallets();
  const { addToast } = useFinanceStore();

  const loading = txLoading || walletsLoading;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // AI insight banner dismiss state (client-side only, resets on reload)
  const [insightDismissed, setInsightDismissed] = useState(false);

  // Modals are rendered into a portal (see below) so they escape any ancestor
  // with backdrop-filter/transform, which would otherwise break `fixed` positioning.
  // `mounted` guards against calling document.body during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Form Fields State (shared between add and edit)
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    category: '',
    walletId: '',
    recipientName: '',
    status: 'completed' as TransactionStatus,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form fields
  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      walletId: cards[0]?.id || '',
      recipientName: '',
      status: 'completed',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setFormErrors({});
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.category,
      walletId: tx.walletId,
      recipientName: tx.recipientName,
      status: tx.status,
      date: new Date(tx.date).toISOString().split('T')[0],
      notes: tx.notes || ''
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Form Submission
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const amt = parseFloat(formData.amount);

    if (isNaN(amt) || amt <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    if (!formData.walletId) {
      errors.walletId = 'Wallet/Account is required';
    }
    if (!formData.recipientName.trim()) {
      errors.recipientName = 'Recipient/Payee is required';
    }
    if (!formData.date) {
      errors.date = 'Date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please complete all required fields', 'error');
      return;
    }

    const payload = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      walletId: formData.walletId,
      recipientName: formData.recipientName,
      status: formData.status,
      date: new Date(formData.date).getTime(),
      notes: formData.notes.trim() ? formData.notes : null
    };

    if (isAddOpen) {
      addTransaction(payload);
      addToast('Transaction created successfully', 'success');
      setIsAddOpen(false);
    } else if (isEditOpen && editingTx) {
      editTransaction(editingTx.id, payload);
      addToast('Transaction updated successfully', 'success');
      setIsEditOpen(false);
      setEditingTx(null);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    addToast('Transaction deleted successfully', 'success');
    setDeleteConfirmId(null);
    // Adjust pagination page if last item on page deleted
    const totalItemsAfter = filteredTransactions.length - 1;
    const maxPages = Math.ceil(totalItemsAfter / itemsPerPage);
    if (currentPage > maxPages && maxPages > 0) {
      setCurrentPage(maxPages);
    }
  };

  // 1. Process Filtering & Searching
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.recipientName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    // Wallet filter
    if (walletFilter !== 'all') {
      result = result.filter((t) => t.walletId === walletFilter);
    }

    // Sort mappings
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date - a.date;
      if (sortBy === 'date-asc') return a.date - b.date;
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchQuery, typeFilter, categoryFilter, walletFilter, sortBy]);

  // 2. Pagination Calculations
  const paginatedTransactions = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(offset, offset + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

  // Which page number buttons to render (with ellipses for large page counts)
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  // Options lists
  const availableCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => list.add(t.category));
    return Array.from(list);
  }, [transactions]);

  // UI Categories list for form dropdown
  const formCategories = formData.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  // 3. Recurring expense insight — real month-over-month comparison, not a fabricated number.
  // Finds the category with the largest genuine spend increase vs last month; hides itself
  // if there isn't enough history to say anything meaningful.
  const recurringInsight = useMemo(() => {
    const now = new Date();
    const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    const curByCat: Record<string, number> = {};
    const prevByCat: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type !== 'expense' || t.status !== 'completed') return;
      if (t.date >= firstOfCurrentMonth) {
        curByCat[t.category] = (curByCat[t.category] || 0) + t.amount;
      } else if (t.date >= firstOfPrevMonth && t.date < firstOfCurrentMonth) {
        prevByCat[t.category] = (prevByCat[t.category] || 0) + t.amount;
      }
    });

    type Insight = { category: string; pctChange: number; curAmount: number };

    const candidates: Insight[] = Object.keys(curByCat)
      .map((cat): Insight | null => {
        const cur = curByCat[cat];
        const prev = prevByCat[cat] || 0;
        if (prev <= 0) return null; // need a real baseline to compute a meaningful % change
        const pct = ((cur - prev) / prev) * 100;
        if (pct <= 0) return null;
        return { category: cat, pctChange: pct, curAmount: cur };
      })
      .filter((x): x is Insight => x !== null);

    if (candidates.length === 0) return null;

    return candidates.reduce((best, cur) => (cur.pctChange > best.pctChange ? cur : best));
  }, [transactions]);

  // 4. Net worth forecast — projected from your actual average monthly net savings
  // this year, not a hardcoded figure. Includes a small real sparkline of the last
  // 4 months' reconstructed balance (same technique as the dashboard's Net Worth chart).
  const netWorthForecast = useMemo(() => {
    const now = new Date();
    const monthsElapsed = now.getMonth() + 1;
    const firstOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    let ytdNet = 0;
    transactions.forEach((t) => {
      if (t.status !== 'completed' || t.date < firstOfYear) return;
      ytdNet += t.type === 'income' ? t.amount : -t.amount;
    });

    const avgMonthlyNet = monthsElapsed > 0 ? ytdNet / monthsElapsed : 0;
    const monthsRemaining = Math.max(0, 12 - monthsElapsed);
    const projected = avgMonthlyNet * monthsRemaining;

    const currentBalance = cards.reduce((sum, c) => sum + c.balance, 0);
    const points: { value: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      const netSince = transactions.reduce((sum, t) => {
        if (t.status !== 'completed' || t.date < nextMonthStart) return sum;
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);
      points.push({ value: Math.round(currentBalance - netSince) });
    }

    return { projected, points, hasData: transactions.some(t => t.date >= firstOfYear) };
  }, [transactions, cards]);

  const formatVal = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val);
  };

  // Real CSV export of whatever is currently filtered/sorted on screen
  const handleDownloadCsv = () => {
    const headers = ['Date', 'Recipient', 'Category', 'Wallet', 'Type', 'Status', 'Amount', 'Notes'];
    const rows = filteredTransactions.map((t) => {
      const card = cards.find((c) => c.id === t.walletId);
      return [
        new Date(t.date).toISOString().split('T')[0],
        t.recipientName,
        t.category,
        card?.nickname || 'Unknown',
        t.type,
        t.status,
        t.amount.toFixed(2),
        t.notes || ''
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pocketflow-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pf-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Transactions</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Review and manage your financial activities. Total transactions: {filteredTransactions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-white/10 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-on-primary bg-pf-primary rounded-xl hover:bg-pf-primary-container transition-all shadow-md shadow-pf-primary/20 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`${cardBase} p-3 flex flex-wrap items-center gap-3`}>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-white/5 rounded-lg flex-1 min-w-[180px]">
          <Search className="h-4 w-4 text-on-surface-variant shrink-0" />
          <input
            type="text"
            placeholder="Recipient, notes..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-0 w-full"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-white/5 rounded-lg">
          <Filter className="h-4 w-4 text-on-surface-variant shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-on-surface focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-surface-container" value="all">All Types</option>
            <option className="bg-surface-container" value="income">Incomes</option>
            <option className="bg-surface-container" value="expense">Expenses</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-white/5 rounded-lg">
          <Tag className="h-4 w-4 text-on-surface-variant shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-on-surface focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-surface-container" value="all">All Categories</option>
            {availableCategories.map((c) => (
              <option className="bg-surface-container" key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Wallet Filter */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-white/5 rounded-lg">
          <Wallet className="h-4 w-4 text-on-surface-variant shrink-0" />
          <select
            value={walletFilter}
            onChange={(e) => { setWalletFilter(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-on-surface focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-surface-container" value="all">All Wallets</option>
            {cards.map((c) => (
              <option className="bg-surface-container" key={c.id} value={c.id}>{c.nickname || 'Unnamed Account'}</option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-white/5 rounded-lg">
          <ArrowUpDown className="h-4 w-4 text-on-surface-variant shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-sm text-on-surface focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-surface-container" value="date-desc">Newest First</option>
            <option className="bg-surface-container" value="date-asc">Oldest First</option>
            <option className="bg-surface-container" value="amount-desc">Highest Amount</option>
            <option className="bg-surface-container" value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Main Transactions Card */}
      <div className={`${cardBase} overflow-hidden`}>

        {/* Table View (for larger screens) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Recipient / Payee</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Wallet / Account</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedTransactions.map((tx) => {
                const card = cards.find(c => c.id === tx.walletId);
                const isIncome = tx.type === 'income';
                const Icon = getCategoryIcon(tx.category);
                const statusVisual = getStatusVisual(tx.status);

                return (
                  <tr key={tx.id} className="text-sm text-on-surface-variant hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10 shrink-0">
                          <Icon className="h-4.5 w-4.5 text-on-surface" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-on-surface truncate">{tx.recipientName}</div>
                          {tx.notes && <div className="text-xs text-on-surface-variant mt-0.5 max-w-[200px] truncate">{tx.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isIncome ? 'bg-tertiary-container/20 text-tertiary' : 'bg-pf-primary/10 text-pf-primary'}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium">
                      {card ? `${card.nickname || 'Card'} (${card.cardNumber})` : 'Unknown Account'}
                    </td>
                    <td className="py-4 px-6 font-medium">
                      {new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className={`flex items-center gap-2 font-medium ${statusVisual.text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusVisual.dot}`} />
                        {statusVisual.label}
                      </div>
                    </td>
                    <td className={`py-4 px-6 font-bold ${isIncome ? 'text-tertiary' : 'text-error'}`}>
                      {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-2 text-on-surface-variant hover:text-pf-primary rounded-lg hover:bg-white/5 transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-error/10 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card list View (for Mobile screens) */}
        <div className="block md:hidden divide-y divide-white/5">
          {paginatedTransactions.map((tx) => {
            const card = cards.find(c => c.id === tx.walletId);
            const isIncome = tx.type === 'income';
            const statusVisual = getStatusVisual(tx.status);

            return (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{tx.recipientName}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{tx.category} • {card?.nickname || 'Account'}</p>
                  </div>
                  <p className={`text-sm font-bold ${isIncome ? 'text-tertiary' : 'text-error'}`}>
                    {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>

                {tx.notes && (
                  <p className="text-xs text-on-surface-variant bg-surface-container-lowest p-2 rounded-lg italic">
                    {tx.notes}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-on-surface-variant">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div className={`flex items-center gap-1.5 font-medium ${statusVisual.text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusVisual.dot}`} />
                      {statusVisual.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(tx)}
                      className="p-1.5 text-on-surface-variant hover:text-pf-primary rounded-md hover:bg-white/5"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(tx.id)}
                      className="p-1.5 text-on-surface-variant hover:text-error rounded-md hover:bg-error/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-on-surface">No transactions yet.</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
              No results found matching your search or filters. Modify filters or create a new transaction record.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-semibold text-on-primary bg-pf-primary hover:bg-pf-primary-container transition-all rounded-lg shadow-sm"
            >
              Add New Record
            </button>
          </div>
        )}

        {/* Pagination Panel */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5 text-sm">
            <span className="text-xs text-on-surface-variant">
              Showing {Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(filteredTransactions.length, currentPage * itemsPerPage)} of {filteredTransactions.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-white/10 text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-on-surface-variant px-1 text-xs">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === currentPage
                        ? 'bg-pf-primary text-on-primary'
                        : 'hover:bg-white/5 text-on-surface-variant'
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-white/10 text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Insight Banners — real computations from your transaction history, not demo numbers.
          Each hides itself automatically if there isn't enough data to say something meaningful. */}
      {(recurringInsight || netWorthForecast.hasData) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {recurringInsight && !insightDismissed && (
            <div className={`${cardBase} ai-border-active p-5 md:col-span-2`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-pf-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-pf-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-on-surface mb-1">Recurring Expense Alert</h4>
                    <button
                      onClick={() => setInsightDismissed(true)}
                      className="text-on-surface-variant hover:text-on-surface shrink-0"
                      aria-label="Dismiss insight"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    Your <span className="font-semibold text-on-surface">{recurringInsight.category}</span> spending is up{' '}
                    <span className="font-semibold text-error">{recurringInsight.pctChange.toFixed(0)}%</span> this month
                    ({formatVal(recurringInsight.curAmount)} so far), based on your recorded transactions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {netWorthForecast.hasData && (
            <div className={`${cardBase} p-5 flex flex-col justify-between overflow-hidden relative ${!recurringInsight || insightDismissed ? 'md:col-span-3' : ''}`}>
              <div className="relative z-10">
                <h4 className="text-base font-bold text-on-surface mb-1">Net Worth Forecast</h4>
                <p className="text-xs text-on-surface-variant mb-3">Based on your average monthly savings this year</p>
                <div className={`text-3xl font-bold ${netWorthForecast.projected >= 0 ? 'text-pf-primary' : 'text-error'}`}>
                  {netWorthForecast.projected >= 0 ? '+' : '-'}{formatVal(Math.abs(netWorthForecast.projected))}
                </div>
                <p className="text-xs text-pf-primary mt-1">Projected by year-end</p>
              </div>
              <div className="h-12 w-full mt-3 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthForecast.points} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastSparkGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#adc6ff" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#adc6ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#adc6ff" strokeWidth={2} fill="url(#forecastSparkGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Add & Edit Modal Dialog — rendered in a portal, and using an explicit inline
          width instead of max-w-lg (the Tailwind class wasn't being applied here,
          same root cause fixed on the dashboard's modal). */}
      {mounted && (isAddOpen || isEditOpen) && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-jm-navy rounded-2xl shadow-2xl border border-jm-dark-blue p-6 relative"
            style={{ width: '640px', maxWidth: '95vw', maxHeight: '90vh' }}
          >
            <h2 className="text-xl font-bold text-white mb-6 shrink-0">
              {isAddOpen ? 'Add Transaction' : 'Edit Transaction'}
            </h2>

            <div className="overflow-y-auto max-h-[70vh] pr-2">
              <form onSubmit={handleSaveTransaction} className="space-y-5">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setFormData(f => ({ ...f, type: 'expense', category: '' })) }}
                      className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${formData.type === 'expense'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormData(f => ({ ...f, type: 'income', category: '' })) }}
                      className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${formData.type === 'income'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))}
                      className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${formErrors.amount ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-jm-dark-blue/80'
                        }`}
                    />
                    {formErrors.amount && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.amount}</p>}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                      className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${formErrors.date ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-jm-dark-blue/80'
                        }`}
                    />
                    {formErrors.date && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.date}</p>}
                  </div>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                    className={`w-full h-11 px-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white ${formErrors.category ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-jm-dark-blue/80'
                      }`}
                  >
                    <option value="">Select Category</option>
                    {formCategories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.category}</p>}
                </div>

                {/* Wallet Card Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Wallet / Account</label>
                  <select
                    value={formData.walletId}
                    onChange={(e) => setFormData(f => ({ ...f, walletId: e.target.value }))}
                    className={`w-full h-11 px-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white ${formErrors.walletId ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-jm-dark-blue/80'
                      }`}
                  >
                    <option value="">Select Wallet</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname || 'Unnamed Card'} ({c.cardNumber}) - ${c.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {formErrors.walletId && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.walletId}</p>}
                </div>

                {/* Recipient / Payee */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Recipient / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon, Salary payout"
                    value={formData.recipientName}
                    onChange={(e) => setFormData(f => ({ ...f, recipientName: e.target.value }))}
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${formErrors.recipientName ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-jm-dark-blue/80'
                      }`}
                  />
                  {formErrors.recipientName && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.recipientName}</p>}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                  <textarea
                    placeholder="Additional descriptions..."
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                    className="w-full p-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setEditingTx(null); }}
                    className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue shadow-md"
                  >
                    {isAddOpen ? 'Add Transaction' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Dialog — also portaled for the same reason */}
      {mounted && deleteConfirmId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-jm-navy rounded-2xl shadow-2xl border border-jm-dark-blue p-6 relative"
            style={{
              width: "500px",
              maxWidth: "95vw",
            }}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-white">
                Delete Transaction?
              </h3>
            </div>

            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete this transaction record? This action
              will restore the amount to the wallet balance and cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-800 text-slate-400"
              >
                No, Keep It
              </button>

              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-md"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}