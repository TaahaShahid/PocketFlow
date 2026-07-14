'use client';

import React, { useMemo } from 'react';
import { useFinanceStore, CATEGORIES } from '../../../hooks/useFinanceStore';
import { useTransactions } from '@/context/TransactionContext';
import { useBudgets } from '@/context/BudgetContext';
import { Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp as TrendingUpIcon,
  Percent,
  Calendar
} from 'lucide-react';

export default function AnalyticsPage() {
  const { transactions, loading: txLoading } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();

  const loading = txLoading || budgetsLoading;

  // Color arrays for Pie Chart slices
  const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#14B8A6', '#6366F1', '#6B7280'];

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

    // Seed the map with last 6 months to make sure it is populated
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

    // Sort by chronological order
    return Object.values(monthlyMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Format Helper
  const formatVal = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(val);
  };

  const topSpendingCategory = categoryData[0]?.name || 'N/A';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pf-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Financial Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Deep-dive analyses of income, expenses, savings rate, and category breakdowns.
        </p>
      </div>

      {/* Top statistics callout widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 bg-white glass-card border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumulative Income</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{formatVal(stats.totalIncome)}</h3>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 bg-white glass-card border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumulative Expenses</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{formatVal(stats.totalExpense)}</h3>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="p-5 bg-white glass-card border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Savings Rate</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{stats.savingsRate.toFixed(1)}%</h3>
            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Most Expensive Category */}
        <div className="p-5 bg-white glass-card border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Spending Area</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight truncate max-w-[150px]">{topSpendingCategory}</h3>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <PieIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Income vs Expenses Chart (2 cols wide) */}
        <div className="lg:col-span-2 p-5 bg-white glass-card border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Income vs Expenses Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Comparison of inflows and outflows over the past 6 months</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.15)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  className="text-slate-400 font-medium dark:text-slate-500"
                />
                <YAxis
                  tickFormatter={(val) => `$${val}`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  className="text-slate-400 font-medium dark:text-slate-500"
                />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} name="Inflow (Income)" />
                <Bar dataKey="Expense" fill="#2E3A8C" radius={[4, 4, 0, 0]} name="Outflow (Expenses)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (1 col wide) */}
        <div className="p-5 bg-white glass-card border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Spending by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Proportionate breakdown of expense categories</p>

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
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
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
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[130px]">{entry.name}</span>
                </div>
                <span className="text-slate-800 dark:text-slate-200">${entry.value.toFixed(0)}</span>
              </div>
            ))}
            {categoryData.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No expense categories logged.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Budget Limit vs Spent Utilization horizontal bars */}
      <div className="p-5 bg-white glass-card border border-slate-100 dark:border-jm-dark-blue rounded-2xl shadow-sm">
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Budget Allocation Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">Assessing budget limits against month-to-date spending</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const ratio = b.monthlyLimit > 0 ? (b.spent / b.monthlyLimit) * 100 : 0;
            const isOver = b.spent > b.monthlyLimit;

            return (
              <div key={b.id} className="p-4 rounded-xl border border-slate-100 dark:border-jm-dark-blue/80 bg-slate-50/40 dark:bg-slate-900/10 space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-800 dark:text-white">{b.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${isOver
                    ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                    {isOver ? 'Limit Exceeded' : `${ratio.toFixed(0)}% Utilized`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : ratio >= 80 ? 'bg-amber-500' : 'bg-jm-dark-blue'
                      }`}
                    style={{ width: `${Math.min(100, ratio)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Spent: <strong className="text-slate-700 dark:text-slate-300">${b.spent.toFixed(2)}</strong></span>
                  <span>Limit: <strong>${b.monthlyLimit.toFixed(0)}</strong></span>
                </div>
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-slate-400">
              No budgets found. Configure them on the Dashboard or add budget limits.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
