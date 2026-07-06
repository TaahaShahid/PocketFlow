'use client';

import React, { useState, useMemo } from 'react';
import { useFinanceStore, CATEGORIES } from '../hooks/useFinanceStore';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet as WalletIcon, 
  Plus, 
  PiggyBank, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';

// Quick Custom Transaction Modal for instant data input
function AddTransactionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cards, addTransaction, addToast } = useFinanceStore();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [walletId, setWalletId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    // Validations
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }
    if (!category) {
      newErrors.category = 'Category is required';
    }
    if (!walletId) {
      newErrors.walletId = 'Wallet/Account is required';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    }
    if (!recipient.trim()) {
      newErrors.recipient = 'Recipient or Payee name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Please fix validation errors', 'error');
      return;
    }

    // Process Add Transaction
    addTransaction({
      type,
      amount: numAmount,
      category,
      walletId,
      recipientName: recipient,
      status: 'completed',
      date: new Date(date).getTime(),
      notes: notes || null
    });

    addToast('Transaction recorded successfully!', 'success');
    onClose();
  };

  const currentCategories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-jm-navy rounded-2xl shadow-xl border border-slate-200 dark:border-jm-dark-blue p-6 relative">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Add Transaction</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory(''); }}
                className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategory(''); }}
                className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                  type === 'income'
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                  errors.amount ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                }`}
              />
              {errors.amount && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.amount}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                  errors.date ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                }`}
              />
              {errors.date && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.date}</p>}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                errors.category ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
              }`}
            >
              <option value="">Select Category</option>
              {currentCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.category}</p>}
          </div>

          {/* Wallet / Card Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Wallet / Account</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                errors.walletId ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
              }`}
            >
              <option value="">Select Wallet</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname || 'Unnamed Card'} ({c.cardNumber}) - ${c.balance.toFixed(2)}
                </option>
              ))}
            </select>
            {errors.walletId && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.walletId}</p>}
          </div>

          {/* Recipient / Payee */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Recipient / Payee</label>
            <input
              type="text"
              placeholder="e.g. Starbucks, Salary Inc."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent ${
                errors.recipient ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
              }`}
            />
            {errors.recipient && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.recipient}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
            <textarea
              placeholder="Additional comments or descriptions..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue transition-colors shadow-md shadow-jm-dark-blue/20"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { transactions, cards, goals, budgets } = useFinanceStore();
  const [chartPeriod, setChartPeriod] = useState<'this-month' | 'last-3' | 'last-6' | 'this-year'>('this-month');
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  // 1. Calculate Key Metrics
  // We'll calculate totals for current month and previous month to show percentage changes
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const firstOfCurrentMonth = new Date(currentYear, currentMonth, 1).getTime();
    const firstOfPrevMonth = new Date(currentYear, currentMonth - 1, 1).getTime();

    let curIncome = 0;
    let curExpense = 0;
    let prevIncome = 0;
    let prevExpense = 0;

    transactions.forEach((t) => {
      if (t.status !== 'completed') return;
      
      if (t.date >= firstOfCurrentMonth) {
        if (t.type === 'income') curIncome += t.amount;
        else curExpense += t.amount;
      } else if (t.date >= firstOfPrevMonth && t.date < firstOfCurrentMonth) {
        if (t.type === 'income') prevIncome += t.amount;
        else prevExpense += t.amount;
      }
    });

    const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
    const curSavings = curIncome - curExpense;
    const prevSavings = prevIncome - prevExpense;

    // Helper to calculate percentage change
    const getChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // Calculate percentage change for total balance:
    // (We will simulate it based on this month's savings versus current balance as a baseline)
    const balanceChange = getChange(totalBalance, totalBalance - curSavings);
    const incomeChange = getChange(curIncome, prevIncome);
    const expenseChange = getChange(curExpense, prevExpense);
    const savingsChange = getChange(curSavings, prevSavings);

    return {
      totalBalance,
      balanceChange,
      income: curIncome,
      incomeChange,
      expense: curExpense,
      expenseChange,
      savings: curSavings,
      savingsChange
    };
  }, [transactions, cards]);

  // 2. Prepare Income Chart Data
  const incomeChartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let startDate = new Date();

    if (chartPeriod === 'this-month') {
      startDate = new Date(currentYear, currentMonth, 1);
    } else if (chartPeriod === 'last-3') {
      startDate = new Date(currentYear, currentMonth - 2, 1);
    } else if (chartPeriod === 'last-6') {
      startDate = new Date(currentYear, currentMonth - 5, 1);
    } else if (chartPeriod === 'this-year') {
      startDate = new Date(currentYear, 0, 1);
    }

    const startTimestamp = startDate.getTime();

    // If "This month", split by weeks
    if (chartPeriod === 'this-month') {
      const data = [
        { label: 'Week 1', Fixed: 0, Variable: 0 },
        { label: 'Week 2', Fixed: 0, Variable: 0 },
        { label: 'Week 3', Fixed: 0, Variable: 0 },
        { label: 'Week 4', Fixed: 0, Variable: 0 },
      ];

      transactions.forEach((t) => {
        if (t.type !== 'income' || t.date < startTimestamp || t.status !== 'completed') return;
        const txDate = new Date(t.date);
        const dayOfMonth = txDate.getDate();
        
        let weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
        const isFixed = t.category === 'Salary'; // Salary is Fixed, others Variable
        
        if (isFixed) {
          data[weekIndex].Fixed += t.amount;
        } else {
          data[weekIndex].Variable += t.amount;
        }
      });
      return data;
    }

    // For multi-month views, group by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthDataMap: Record<string, { label: string; Fixed: number; Variable: number; order: number }> = {};

    // Seed map with expected months
    let iter = new Date(startDate);
    let order = 0;
    while (iter <= now) {
      const label = `${months[iter.getMonth()]} ${iter.getFullYear().toString().substring(2)}`;
      monthDataMap[label] = { label, Fixed: 0, Variable: 0, order };
      iter.setMonth(iter.getMonth() + 1);
      order++;
    }

    transactions.forEach((t) => {
      if (t.type !== 'income' || t.date < startTimestamp || t.status !== 'completed') return;
      const txDate = new Date(t.date);
      const label = `${months[txDate.getMonth()]} ${txDate.getFullYear().toString().substring(2)}`;
      
      if (monthDataMap[label]) {
        const isFixed = t.category === 'Salary';
        if (isFixed) {
          monthDataMap[label].Fixed += t.amount;
        } else {
          monthDataMap[label].Variable += t.amount;
        }
      }
    });

    return Object.values(monthDataMap).sort((a, b) => a.order - b.order);
  }, [transactions, chartPeriod]);

  // 3. Extract Recent Transactions (last 5)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Format Helper
  const formatVal = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val);
  };

  const renderTrend = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`inline-flex items-center text-xs font-bold gap-0.5 px-2 py-1 rounded-lg ${
        isPositive 
          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
      }`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Upper Panel: Welcome and CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">JM Solutionss Financial Command Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and transaction management system.
          </p>
        </div>
        <button
          onClick={() => setIsAddTxOpen(true)}
          className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue transition-all shadow-md shadow-jm-dark-blue/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col justify-between min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Balance</span>
            <div className="p-2 bg-jm-dark-blue/10 dark:bg-jm-light-blue/20 rounded-xl text-jm-dark-blue dark:text-jm-light-blue">
              <WalletIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{formatVal(metrics.totalBalance)}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              {renderTrend(metrics.balanceChange)}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">from last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col justify-between min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Monthly Income</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{formatVal(metrics.income)}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              {renderTrend(metrics.incomeChange)}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">from last month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Expense */}
        <div className="p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col justify-between min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Monthly Expenses</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{formatVal(metrics.expense)}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              {renderTrend(metrics.expenseChange)}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">from last month</span>
            </div>
          </div>
        </div>

        {/* Card 4: Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col justify-between min-h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Monthly Savings</span>
            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{formatVal(metrics.savings)}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              {renderTrend(metrics.savingsChange)}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel Content: Chart & Side info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income Chart Card (2 Columns wide) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Income Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5">Fixed vs Variable income split over time</p>
            </div>
            
            {/* Period Selector Tabs */}
            <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-jm-dark-blue/80 p-1 rounded-xl">
              {(['this-month', 'last-3', 'last-6', 'this-year'] as const).map((p) => {
                const labelMap = {
                  'this-month': 'This Month',
                  'last-3': '3 Months',
                  'last-6': '6 Months',
                  'this-year': 'This Year'
                };
                return (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      chartPeriod === p
                        ? 'bg-jm-dark-blue text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {labelMap[p]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incomeChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.15)" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  className="text-slate-400 dark:text-slate-500 font-medium"
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  className="text-slate-400 dark:text-slate-500 font-medium"
                />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                {/* Fixed Income = Dark Blue, Variable = Light Blue */}
                <Bar dataKey="Fixed" stackId="a" fill="#2E3A8C" radius={[0, 0, 0, 0]} name="Fixed (Salary)" />
                <Bar dataKey="Variable" stackId="a" fill="#4A5FD9" radius={[4, 4, 0, 0]} name="Variable (Consulting/Freelance)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budgets Tracker Card (1 Column wide) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Budget Utilization</h3>
              <Link href="/analytics" className="text-xs font-semibold text-jm-light-blue hover:underline flex items-center">
                <span>View All</span>
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {budgets.slice(0, 4).map((b) => {
                const ratio = b.monthlyLimit > 0 ? (b.spent / b.monthlyLimit) * 100 : 0;
                let colorClass = 'bg-jm-dark-blue';
                if (ratio >= 90) colorClass = 'bg-rose-500';
                else if (ratio >= 75) colorClass = 'bg-amber-500';

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{b.category}</span>
                      <span className="text-slate-400">
                        ${b.spent.toFixed(0)} / <span className="text-slate-600 dark:text-slate-400">${b.monthlyLimit}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.min(100, ratio)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {budgets.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-400 font-medium">
                  No budgets configured.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-jm-dark-blue mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Monthly Limit Total:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ${budgets.reduce((sum, b) => sum + b.monthlyLimit, 0)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Lower Panel Content: Recent Transactions & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List (2 Columns wide) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
            <Link href="/transactions" className="text-xs font-semibold text-jm-light-blue hover:underline flex items-center">
              <span>See History</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-jm-dark-blue/55">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const card = cards.find(c => c.id === tx.walletId);
              
              return (
                <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                      isIncome 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      <DollarSign className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {tx.recipientName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 dark:text-slate-400 font-medium">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span className="truncate">{card?.nickname || 'Account'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      isIncome ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'
                    }`}>
                      {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
            {recentTransactions.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-400 font-medium">
                No transactions yet.
              </div>
            )}
          </div>
        </div>

        {/* Savings Goals progress (1 Column wide) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Savings Goals</h3>
            <Link href="/goals" className="text-xs font-semibold text-jm-light-blue hover:underline flex items-center">
              <span>Details</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {goals.slice(0, 3).map((g) => {
              const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              const daysLeft = Math.max(0, Math.ceil((g.deadline - Date.now()) / (24 * 60 * 60 * 1000)));

              return (
                <div key={g.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-jm-dark-blue/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-jm-dark-blue/10 dark:bg-jm-light-blue/20 rounded-lg text-jm-dark-blue dark:text-jm-light-blue">
                        <PiggyBank className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {g.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {g.status === 'completed' ? 'Completed' : `${daysLeft} Days left`}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-jm-light-blue rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">
                      ${g.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-slate-400">
                      target ${g.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400 font-medium">
                Create your first savings goal.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Transaction Modal component */}
      <AddTransactionModal 
        isOpen={isAddTxOpen} 
        onClose={() => setIsAddTxOpen(false)} 
      />

    </div>
  );
}
