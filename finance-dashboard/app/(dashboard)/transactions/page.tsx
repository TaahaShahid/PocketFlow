'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore, CATEGORIES } from '../../../hooks/useFinanceStore';
import { useTransactions } from '@/context/TransactionContext';
import { useWallets } from '@/context/WalletContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Transaction, TransactionType, TransactionStatus } from '../../../types';
import { Loader2, Plus, Search, Trash2, Edit3, ChevronLeft, ChevronRight, Filter, Tag, Wallet, ArrowUpDown, AlertTriangle, Download, Sparkles, X, Utensils, ShoppingBag, Car, Film, CreditCard, DollarSign, Calendar, User, Layers, type LucideIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

function getCategoryIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (/food|dining|restaurant|grocery/.test(c)) return Utensils;
  if (/shop|retail|cloth/.test(c)) return ShoppingBag;
  if (/transport|gas|car|fuel|uber/.test(c)) return Car;
  if (/entertain|movie|stream|game/.test(c)) return Film;
  if (/salary|income|freelance|consult/.test(c)) return DollarSign;
  return CreditCard;
}

function getStatusVisual(status: string): { dot: string; text: string; bg: string; label: string } {
  const s = status.toLowerCase();
  if (s === 'completed') return { dot: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/10', label: 'Completed' };
  if (s === 'pending') return { dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/10', label: 'Pending' };
  return { dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10 border-destructive/10', label: status.charAt(0).toUpperCase() + status.slice(1) };
}

const cardBase = 'rounded-3xl border border-border bg-card/45 backdrop-blur-xl shadow-2xl transition-all duration-300';
const chartTooltipStyle = { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--foreground)' };

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

  // AI insight banner dismiss state
  const [insightDismissed, setInsightDismissed] = useState(false);

  // Form Fields State
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
    const totalItemsAfter = filteredTransactions.length - 1;
    const maxPages = Math.ceil(totalItemsAfter / itemsPerPage);
    if (currentPage > maxPages && maxPages > 0) {
      setCurrentPage(maxPages);
    }
  };

  // 1. Filtering & Searching
  let filteredTransactions = [...transactions];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredTransactions = filteredTransactions.filter(
      (t) =>
        t.recipientName.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    );
  }

  if (typeFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter((t) => t.type === typeFilter);
  }

  if (categoryFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter((t) => t.category === categoryFilter);
  }

  if (walletFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter((t) => t.walletId === walletFilter);
  }

  filteredTransactions.sort((a, b) => {
    if (sortBy === 'date-desc') return b.date - a.date;
    if (sortBy === 'date-asc') return a.date - b.date;
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // 2. Pagination Calculations
  const offset = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(offset, offset + itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

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

  const availableCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => list.add(t.category));
    return Array.from(list);
  }, [transactions]);

  const formCategories = formData.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  // 3. Recurring expense insight
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
        if (prev <= 0) return null;
        const pct = ((cur - prev) / prev) * 100;
        if (pct <= 0) return null;
        return { category: cat, pctChange: pct, curAmount: cur };
      })
      .filter((x): x is Insight => x !== null);

    if (candidates.length === 0) return null;
    return candidates.reduce((best, cur) => (cur.pctChange > best.pctChange ? cur : best));
  }, [transactions]);

  // 4. Net worth forecast
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

  // Real CSV export
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and manage your financial activities. Total transactions: {filteredTransactions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadCsv}
            variant="outline"
            className="rounded-xl border-border hover:bg-muted/10"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download CSV</span>
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="rounded-xl shadow-lg shadow-primary/10"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Entry</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`${cardBase} p-3.5 flex flex-wrap items-center gap-3`}>
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border border-border rounded-xl flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Recipient, notes..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 w-full"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border border-border rounded-xl">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-card" value="all">All Types</option>
            <option className="bg-card" value="income">Incomes</option>
            <option className="bg-card" value="expense">Expenses</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border border-border rounded-xl">
          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-card" value="all">All Categories</option>
            {availableCategories.map((c) => (
              <option className="bg-card" key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Wallet Filter */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border border-border rounded-xl">
          <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={walletFilter}
            onChange={(e) => { setWalletFilter(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-sm text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-card" value="all">All Wallets</option>
            {cards.map((c) => (
              <option className="bg-card" key={c.id} value={c.id}>{c.nickname || 'Unnamed Account'}</option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border border-border rounded-xl">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc')}
            className="bg-transparent border-none text-sm text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option className="bg-card" value="date-desc">Newest First</option>
            <option className="bg-card" value="date-asc">Oldest First</option>
            <option className="bg-card" value="amount-desc">Highest Amount</option>
            <option className="bg-card" value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Main Transactions */}
      <div className={`${cardBase} overflow-hidden`}>
        {/* Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Recipient / Payee</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Wallet / Account</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedTransactions.map((tx) => {
                const card = cards.find(c => c.id === tx.walletId);
                const isIncome = tx.type === 'income';
                const Icon = getCategoryIcon(tx.category);
                const statusVisual = getStatusVisual(tx.status);

                return (
                  <tr key={tx.id} className="text-sm text-muted-foreground hover:bg-muted/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/15 flex items-center justify-center border border-border shrink-0">
                          <Icon className="h-4.5 w-4.5 text-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate">{tx.recipientName}</div>
                          {tx.notes && <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{tx.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${isIncome ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-primary/10 text-primary border border-primary/10'}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-foreground">
                      {card ? `${card.nickname || 'Card'} (${card.cardNumber})` : 'Unknown Account'}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs font-bold ${statusVisual.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusVisual.dot}`} />
                        {statusVisual.label}
                      </div>
                    </td>
                    <td className={`py-4 px-6 font-bold ${isIncome ? 'text-emerald-500' : 'text-destructive'}`}>
                      {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted/10 transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
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

        {/* Mobile List View */}
        <div className="block md:hidden divide-y divide-border/40">
          {paginatedTransactions.map((tx) => {
            const card = cards.find(c => c.id === tx.walletId);
            const isIncome = tx.type === 'income';
            const statusVisual = getStatusVisual(tx.status);

            return (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{tx.recipientName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tx.category} • {card?.nickname || 'Account'}</p>
                  </div>
                  <p className={`text-sm font-bold ${isIncome ? 'text-emerald-500' : 'text-destructive'}`}>
                    {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>

                {tx.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/10 p-2 rounded-xl border border-border italic">
                    {tx.notes}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-semibold">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div className={`inline-flex items-center gap-1.5 font-bold ${statusVisual.text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusVisual.dot}`} />
                      {statusVisual.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(tx)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted/10"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(tx.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
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
            <div className="w-16 h-16 bg-muted/10 border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">No transactions yet.</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              No results found matching your search or filters. Modify filters or create a new transaction record.
            </p>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="mt-4 rounded-xl shadow-md"
            >
              Add New Record
            </Button>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/5 text-sm">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(filteredTransactions.length, currentPage * itemsPerPage)} of {filteredTransactions.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-muted-foreground px-1 text-xs">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === currentPage
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted/10 text-muted-foreground'
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
                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Insight Banners */}
      {(recurringInsight || netWorthForecast.hasData) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recurringInsight && !insightDismissed && (
            <div className={`${cardBase} border-primary/35 p-5 md:col-span-2`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/25">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-foreground mb-1">Recurring Expense Alert</h4>
                    <button
                      onClick={() => setInsightDismissed(true)}
                      className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      aria-label="Dismiss insight"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your <span className="font-semibold text-foreground">{recurringInsight.category}</span> spending is up{' '}
                    <span className="font-bold text-destructive">{recurringInsight.pctChange.toFixed(0)}%</span> this month
                    ({formatVal(recurringInsight.curAmount)} so far), based on your recorded transactions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {netWorthForecast.hasData && (
            <div className={`${cardBase} p-5 flex flex-col justify-between overflow-hidden relative ${!recurringInsight || insightDismissed ? 'md:col-span-3' : ''}`}>
              <div className="relative z-10">
                <h4 className="text-base font-bold text-foreground mb-1">Net Worth Forecast</h4>
                <p className="text-xs text-muted-foreground mb-3 font-medium">Based on your average monthly savings this year</p>
                <div className={`text-3xl font-extrabold ${netWorthForecast.projected >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {netWorthForecast.projected >= 0 ? '+' : '-'}{formatVal(Math.abs(netWorthForecast.projected))}
                </div>
                <p className="text-xs text-primary font-bold mt-1.5 uppercase tracking-wider">Projected by year-end</p>
              </div>
              <div className="h-12 w-full mt-3 opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthForecast.points} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastSparkGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#forecastSparkGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit / Add Modal Dialog */}
      <AnimatePresence>
        {(isAddOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setEditingTx(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-lg overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h2 className="text-xl font-bold tracking-tight">
                  {isAddOpen ? 'Add Transaction' : 'Edit Transaction'}
                </h2>
                <button
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setEditingTx(null); }}
                  className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[70vh] pr-1">
                <form onSubmit={handleSaveTransaction} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Type</label>
                    <div className="grid grid-cols-2 gap-2 bg-muted/10 p-1 border border-border rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setFormData(f => ({ ...f, type: 'expense', category: '' })) }}
                        className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${formData.type === 'expense'
                          ? 'bg-destructive text-destructive-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFormData(f => ({ ...f, type: 'income', category: '' })) }}
                        className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${formData.type === 'income'
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))}
                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                        ${formErrors.amount ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                      />
                      {formErrors.amount && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.amount}</p>}
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                        ${formErrors.date ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                      />
                      {formErrors.date && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.date}</p>}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${formErrors.category ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                    >
                      <option value="" className="bg-card">Select Category</option>
                      {formCategories.map((c) => (
                        <option key={c.name} value={c.name} className="bg-card">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.category}</p>}
                  </div>

                  {/* Wallet Selector */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Account
                    </label>
                    <select
                      value={formData.walletId}
                      onChange={(e) => setFormData(f => ({ ...f, walletId: e.target.value }))}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${formErrors.walletId ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                    >
                      <option value="" className="bg-card">Select Account</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id} className="bg-card">
                          {c.nickname || 'Unnamed Card'} ({c.cardNumber}) - ${c.balance.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {formErrors.walletId && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.walletId}</p>}
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Payee / Recipient
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon, Salary payout"
                      value={formData.recipientName}
                      onChange={(e) => setFormData(f => ({ ...f, recipientName: e.target.value }))}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${formErrors.recipientName ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                    />
                    {formErrors.recipientName && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.recipientName}</p>}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                    <textarea
                      placeholder="Additional descriptions..."
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                      className="w-full p-3 border rounded-xl text-sm bg-muted/10 border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setEditingTx(null); }}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl shadow-md"
                    >
                      {isAddOpen ? 'Add Transaction' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-md z-10"
            >
              <div className="flex items-center gap-3 text-destructive">
                <div className="p-2 bg-destructive/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Delete Transaction?</h3>
              </div>

              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete this transaction record? This action
                will restore the amount to the wallet balance and cannot be undone.
              </p>

              <div className="flex justify-end gap-2 pt-6 border-t border-border mt-6">
                <Button
                  onClick={() => setDeleteConfirmId(null)}
                  variant="ghost"
                  className="rounded-xl text-muted-foreground"
                >
                  No, Keep It
                </Button>
                <Button
                  onClick={() => handleDelete(deleteConfirmId)}
                  variant="destructive"
                  className="rounded-xl shadow-md"
                >
                  Yes, Delete Record
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}