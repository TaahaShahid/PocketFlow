'use client';

import React, { useState, useMemo } from 'react';
import { useFinanceStore, CATEGORIES } from '../../hooks/useFinanceStore';
import { Transaction, TransactionType, TransactionStatus } from '../../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  ArrowUpDown, 
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function TransactionsPage() {
  const { transactions, cards, addTransaction, editTransaction, deleteTransaction, addToast } = useFinanceStore();

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

  // Options lists
  const availableCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => list.add(t.category));
    return Array.from(list);
  }, [transactions]);

  // UI Categories list for form dropdown
  const formCategories = formData.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  return (
    <div className="space-y-6">
      
      {/* Upper Panel header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Transaction History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, edit, or append records. Total transactions: {filteredTransactions.length}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue transition-all shadow-md shadow-jm-dark-blue/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Interactive Filters Grid */}
      <div className="p-4 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
        
        {/* Search */}
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Recipient, notes..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 pl-9 pr-3 text-sm font-semibold border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent dark:focus:ring-jm-light-blue"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-11 px-3.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue"
          >
            <option value="all">All Types</option>
            <option value="income">Incomes</option>
            <option value="expense">Expenses</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-11 px-3.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Wallet Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wallet</label>
          <select
            value={walletFilter}
            onChange={(e) => { setWalletFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-11 px-3.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue"
          >
            <option value="all">All Wallets</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>{c.nickname || 'Unnamed Account'}</option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full h-11 px-3.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Main Transactions List / Desktop Grid */}
      <div className="bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table View (for larger screens) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-jm-dark-blue bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Recipient / Payee</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Wallet / Account</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-jm-dark-blue/55">
              {paginatedTransactions.map((tx) => {
                const card = cards.find(c => c.id === tx.walletId);
                const isIncome = tx.type === 'income';

                return (
                  <tr key={tx.id} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{tx.recipientName}</div>
                      {tx.notes && <div className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{tx.notes}</div>}
                    </td>
                    <td className="py-4 px-6 font-semibold">{tx.category}</td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">
                      {card ? `${card.nickname || 'Card'} (${card.cardNumber})` : 'Unknown Account'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">
                      {new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className={`py-4 px-6 font-bold ${isIncome ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                      {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-2 text-slate-400 hover:text-jm-dark-blue dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
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

        {/* Cards list View (for Mobile screens) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-jm-dark-blue/55">
          {paginatedTransactions.map((tx) => {
            const card = cards.find(c => c.id === tx.walletId);
            const isIncome = tx.type === 'income';

            return (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{tx.recipientName}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">{tx.category} • {card?.nickname || 'Account'}</p>
                  </div>
                  <p className={`text-sm font-bold ${isIncome ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                    {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
                
                {tx.notes && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg italic">
                    {tx.notes}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-jm-dark-blue/40">
                  <span className="text-slate-400">
                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(tx)}
                      className="p-1.5 text-slate-500 hover:text-jm-dark-blue dark:hover:text-white rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(tx.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-500 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20"
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
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No transactions yet.</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              No results found matching your search or filters. Modify filters or create a new transaction record.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-jm-dark-blue hover:bg-jm-light-blue transition-all rounded-lg shadow-sm"
            >
              Add New Record
            </button>
          </div>
        )}

        {/* Pagination Panel */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-jm-dark-blue bg-slate-50/30 dark:bg-slate-900/20 text-sm font-semibold">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(filteredTransactions.length, currentPage * itemsPerPage)} of {filteredTransactions.length}
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-white dark:bg-jm-navy rounded-lg disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-300 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-white dark:bg-jm-navy rounded-lg disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Add & Edit Modal Dialog */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-jm-navy rounded-2xl shadow-xl border border-slate-200 dark:border-jm-dark-blue p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {isAddOpen ? 'Add Transaction' : 'Edit Transaction'}
            </h2>
            
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setFormData(f => ({ ...f, type: 'expense', category: '' })) }}
                    className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                      formData.type === 'expense'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormData(f => ({ ...f, type: 'income', category: '' })) }}
                    className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                      formData.type === 'income'
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
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                      formErrors.amount ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
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
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                      formErrors.date ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
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
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                    formErrors.category ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
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
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                    formErrors.walletId ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
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
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                    formErrors.recipientName ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
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
              <div className="flex justify-end gap-2 pt-2">
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
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-jm-navy border border-slate-200 dark:border-jm-dark-blue rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Transaction?</h3>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete this transaction record? This action will restore the amount to the wallet balance and cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                No, Keep It
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
