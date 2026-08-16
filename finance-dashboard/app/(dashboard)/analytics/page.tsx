'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '@/context/TransactionContext';
import { useBudgets } from '@/context/BudgetContext';
import { useFinanceStore, CATEGORIES } from '../../../hooks/useFinanceStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Percent, PieChart as PieIcon, Plus, Edit3, Trash2, X, DollarSign, Tag, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const cardBase = 'rounded-3xl border border-border bg-card/45 backdrop-blur-xl shadow-2xl transition-all duration-300';
const chartTooltipStyle = { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--foreground)' };

export default function AnalyticsPage() {
  const { transactions, loading: txLoading } = useTransactions();
  const { budgets, addBudget, editBudget, removeBudget, loading: budgetsLoading } = useBudgets();
  const { addToast } = useFinanceStore();

  const loading = txLoading || budgetsLoading;

  // Dialog States for Budget CRUD
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<{ id: string; category: string; monthlyLimit: number } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Field States
  const [budgetForm, setBudgetForm] = useState({ category: '', monthlyLimit: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Color arrays for Pie Chart slices
  const COLORS = ['var(--primary)', 'var(--secondary)', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1', '#6B7280'];

  // 1. Calculate general statistics
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;

    transactions.forEach((tx) => {
      if (tx.status !== 'completed') return;
      transactionCount++;
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    });

    const averageTx = transactionCount > 0 ? (totalIncome + totalExpense) / transactionCount : 0;
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      averageTx,
      savingsRate
    };
  }, [transactions]);

  // 2. Spending by Category Pie Chart Data
  const categoryData = useMemo(() => {
    const spendingMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.status === 'completed') {
        spendingMap[tx.category] = (spendingMap[tx.category] || 0) + tx.amount;
      }
    });

    return Object.entries(spendingMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 3. Income vs Expense Trend Data (Grouped by Month)
  const trendData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; Income: number; Expense: number; timestamp: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      monthlyMap[label] = { month: label, Income: 0, Expense: 0, timestamp: d.getTime() };
    }

    transactions.forEach((tx) => {
      if (tx.status !== 'completed') return;
      const txDate = new Date(tx.date);
      const label = `${months[txDate.getMonth()]} ${txDate.getFullYear().toString().substring(2)}`;

      if (monthlyMap[label]) {
        if (tx.type === 'income') {
          monthlyMap[label].Income += tx.amount;
        } else {
          monthlyMap[label].Expense += tx.amount;
        }
      }
    });

    return Object.values(monthlyMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  const formatVal = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(val);
  };

  const topSpendingCategory = categoryData[0]?.name || 'N/A';

  // Budget validation and submission handlers
  const validateBudgetForm = () => {
    const errors: Record<string, string> = {};
    const limit = parseFloat(budgetForm.monthlyLimit);

    if (!budgetForm.category) {
      errors.category = 'Category is required';
    }
    if (isNaN(limit) || limit <= 0) {
      errors.monthlyLimit = 'Monthly limit must be greater than zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setBudgetForm({ category: '', monthlyLimit: '' });
    setFormErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (b: { id: string; category: string; monthlyLimit: number }) => {
    setSelectedBudget(b);
    setBudgetForm({ category: b.category, monthlyLimit: b.monthlyLimit.toString() });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBudgetForm()) {
      addToast('Please complete all budget fields correctly', 'error');
      return;
    }

    const limitVal = parseFloat(budgetForm.monthlyLimit);

    try {
      if (isAddOpen) {
        // Prevent duplicate budgets for same category
        const exists = budgets.some(b => b.category.toLowerCase() === budgetForm.category.toLowerCase());
        if (exists) {
          addToast(`Budget already exists for ${budgetForm.category}`, 'error');
          return;
        }

        await addBudget({
          category: budgetForm.category,
          monthlyLimit: limitVal
        });
        addToast('Budget created successfully', 'success');
        setIsAddOpen(false);
      } else if (isEditOpen && selectedBudget) {
        await editBudget(selectedBudget.id, {
          monthlyLimit: limitVal
        });
        addToast('Budget updated successfully', 'success');
        setIsEditOpen(false);
        setSelectedBudget(null);
      }
      setBudgetForm({ category: '', monthlyLimit: '' });
    } catch (err) {
      console.error(err);
      addToast('Operation failed', 'error');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await removeBudget(id);
      addToast('Budget deleted successfully', 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete budget', 'error');
    }
  };

  // Pre-configured category list filtered to exclude already budgeting categories (for Add Budget)
  const availableFormCategories = useMemo(() => {
    const currentBudgets = budgets.map(b => b.category.toLowerCase());
    return CATEGORIES.expense.filter(cat => !currentBudgets.includes(cat.name.toLowerCase()));
  }, [budgets]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Financial Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Deep-dive analyses of income, expenses, savings rate, and category breakdowns.
        </p>
      </div>

      {/* Stats widget cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cumulative Income */}
        <div className={`${cardBase} p-5`}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cumulative Income</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{formatVal(stats.totalIncome)}</h3>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Cumulative Expenses */}
        <div className={`${cardBase} p-5`}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cumulative Expenses</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{formatVal(stats.totalExpense)}</h3>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div className={`${cardBase} p-5`}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Savings Rate</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{stats.savingsRate.toFixed(1)}%</h3>
            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Top Spending Area */}
        <div className={`${cardBase} p-5`}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top Spending Area</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-xl font-extrabold text-foreground tracking-tight truncate max-w-[150px]">{topSpendingCategory}</h3>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <PieIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Trend Chart */}
        <div className={`${cardBase} lg:col-span-2 p-5 flex flex-col`}>
          <div className="mb-6">
            <h3 className="text-base font-bold text-foreground">Income vs Expenses Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Comparison of inflows and outflows over the past 6 months</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#8c909f', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(val) => `$${val}`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#8c909f', fontSize: 11 }}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} name="Inflow (Income)" />
                <Bar dataKey="Expense" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Outflow (Expenses)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className={`${cardBase} p-5 flex flex-col justify-between`}>
          <div>
            <h3 className="text-base font-bold text-foreground">Spending by Category</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">Proportionate breakdown of expense categories</p>

            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => `$${Number(value as number | string).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Slices legend */}
          <div className="space-y-1.5 mt-4 max-h-32 overflow-y-auto pr-1">
            {categoryData.slice(0, 5).map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground truncate max-w-[130px]">{entry.name}</span>
                </div>
                <span className="text-foreground font-bold">${entry.value.toFixed(0)}</span>
              </div>
            ))}
            {categoryData.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No expense categories logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Allocation Analysis Section (Interactive Budget Manager) */}
      <div className={`${cardBase} p-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Budget Allocation Analysis</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Assessing budget limits against month-to-date spending</p>
          </div>
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="rounded-xl shadow-md self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Create Budget
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const ratio = b.monthlyLimit > 0 ? (b.spent / b.monthlyLimit) * 100 : 0;
            const isOver = b.spent > b.monthlyLimit;

            return (
              <div key={b.id} className="p-4 rounded-2xl border border-border bg-muted/10 space-y-3 relative group">
                <div className="flex justify-between items-start text-sm font-semibold">
                  <div className="min-w-0">
                    <span className="text-foreground font-bold">{b.category}</span>
                    <span className={`block text-[10px] w-fit px-2 py-0.5 rounded-md mt-1 ${isOver
                      ? 'bg-destructive/10 text-destructive border border-destructive/10'
                      : 'bg-muted/20 text-muted-foreground border border-border'
                      }`}>
                      {isOver ? 'Limit Exceeded' : `${ratio.toFixed(0)}% Utilized`}
                    </span>
                  </div>

                  {/* Actions overlay */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit({ id: b.id, category: b.category, monthlyLimit: b.monthlyLimit })}
                      className="p-1 rounded bg-muted/20 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                      title="Edit Budget"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(b.id)}
                      className="p-1 rounded bg-muted/20 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-destructive' : ratio >= 80 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                    style={{ width: `${Math.min(100, ratio)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground pt-1">
                  <span>Spent: <strong className="text-foreground">${b.spent.toFixed(2)}</strong></span>
                  <span>Limit: <strong className="text-foreground">${b.monthlyLimit.toFixed(0)}</strong></span>
                </div>
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground font-semibold">
              No budgets found. Configure your spending limits by creating a budget.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Budget Dialog */}
      <AnimatePresence>
        {(isAddOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedBudget(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-md overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h2 className="text-xl font-bold tracking-tight">
                  {isAddOpen ? 'Create Category Budget' : 'Edit Budget Limit'}
                </h2>
                <button
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedBudget(null); }}
                  className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Expense Category
                  </label>
                  {isAddOpen ? (
                    <select
                      value={budgetForm.category}
                      onChange={(e) => setBudgetForm(f => ({ ...f, category: e.target.value }))}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${formErrors.category ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                    >
                      <option value="" className="bg-card">Select Category</option>
                      {availableFormCategories.map((c) => (
                        <option key={c.name} value={c.name} className="bg-card">{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={budgetForm.category}
                      disabled
                      className="w-full h-10 px-3 border border-border bg-muted/20 text-muted-foreground rounded-xl text-sm font-semibold opacity-70"
                    />
                  )}
                  {formErrors.category && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.category}</p>}
                </div>

                {/* Monthly Limit */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Monthly Spending Limit ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 500"
                    value={budgetForm.monthlyLimit}
                    onChange={(e) => setBudgetForm(f => ({ ...f, monthlyLimit: e.target.value }))}
                    className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                    ${formErrors.monthlyLimit ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                  />
                  {formErrors.monthlyLimit && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.monthlyLimit}</p>}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedBudget(null); }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl shadow-md"
                  >
                    {isAddOpen ? 'Create Budget' : 'Save Changes'}
                  </Button>
                </div>
              </form>
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
                <h3 className="text-lg font-bold">Delete Category Budget?</h3>
              </div>

              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to remove the spending limit for this category? PocketFlow will stop tracking budget progress alerts for this category.
              </p>

              <div className="flex justify-end gap-2 pt-6 border-t border-border mt-6">
                <Button
                  onClick={() => setDeleteConfirmId(null)}
                  variant="ghost"
                  className="rounded-xl text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteBudget(deleteConfirmId)}
                  variant="destructive"
                  className="rounded-xl shadow-md"
                >
                  Remove Budget
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
