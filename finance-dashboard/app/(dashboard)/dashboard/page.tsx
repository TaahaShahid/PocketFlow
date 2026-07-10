'use client';

import React, { useState, useMemo } from 'react';
import { useFinanceStore, CATEGORIES } from '../../../hooks/useFinanceStore';
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
    Activity,
    Utensils,
    ShoppingBag,
    Car,
    Film,
    CreditCard,
    type LucideIcon
} from 'lucide-react';
import {
    BarChart,
    Bar,
    AreaChart,
    Area,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">

            {/* Explicit width and max-width. Remove any flex/grid constraints from parents. */}
            <div
                className="bg-jm-navy rounded-2xl shadow-2xl border border-jm-dark-blue p-6 relative"
                style={{
                    width: "640px",
                    maxWidth: "95vw",
                    maxHeight: "90vh",
                }}
            >

                {/* Header */}
                <h2 className="text-xl font-bold text-white mb-6 shrink-0">
                    Add Transaction
                </h2>

                {/* Scrollable Body: flex-1 and overflow-y-auto ensures inputs don't get squashed */}
                <div className="overflow-y-auto max-h-[70vh] pr-2">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Type Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setType('expense'); setCategory(''); }}
                                    className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${type === 'expense'
                                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setType('income'); setCategory(''); }}
                                    className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${type === 'income'
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    Income
                                </button>
                            </div>
                        </div>

                        {/* Amount & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Amount ($)
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900
                                    text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue
                                    ${errors.amount
                                            ? "border-rose-500 ring-2 ring-rose-500/20"
                                            : "border-slate-200 dark:border-jm-dark-blue/80"
                                        }`}
                                />

                                {errors.amount && (
                                    <p className="text-rose-500 text-xs mt-1">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Date
                                </label>

                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900
                                    text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue
                                    ${errors.date
                                            ? "border-rose-500 ring-2 ring-rose-500/20"
                                            : "border-slate-200 dark:border-jm-dark-blue/80"
                                        }`}
                                />

                                {errors.date && (
                                    <p className="text-rose-500 text-xs mt-1">
                                        {errors.date}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Selects */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                Category
                            </label>

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={`w-full h-11 px-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900
                                text-slate-800 dark:text-white
                                ${errors.category
                                        ? "border-rose-500 ring-2 ring-rose-500/20"
                                        : "border-slate-200 dark:border-jm-dark-blue/80"
                                    }`}
                            >
                                <option value="">Select Category</option>

                                {currentCategories.map((c: any) => (
                                    <option key={c.name} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>

                            {errors.category && (
                                <p className="text-rose-500 text-xs mt-1">
                                    {errors.category}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                Wallet / Account
                            </label>

                            <select
                                value={walletId}
                                onChange={(e) => setWalletId(e.target.value)}
                                className={`w-full h-11 px-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900
                                text-slate-800 dark:text-white
                                ${errors.walletId
                                        ? "border-rose-500 ring-2 ring-rose-500/20"
                                        : "border-slate-200 dark:border-jm-dark-blue/80"
                                    }`}
                            >
                                <option value="">Select Wallet</option>

                                {cards.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nickname} (${c.balance.toFixed(2)})
                                    </option>
                                ))}
                            </select>

                            {errors.walletId && (
                                <p className="text-rose-500 text-xs mt-1">
                                    {errors.walletId}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                Recipient / Payee
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. Starbucks, Salary, Amazon"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900
                                text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue
                                ${errors.recipient
                                        ? "border-rose-500 ring-2 ring-rose-500/20"
                                        : "border-slate-200 dark:border-jm-dark-blue/80"
                                    }`}
                            />


                        </div>

                        {/* Footer Actions (Sticky at bottom of modal if needed, or just end of scroll) */}
                        <div className="flex justify-end gap-2 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">Cancel</button>
                            <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue shadow-md shadow-jm-dark-blue/20">Add Transaction</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

// Maps a transaction/spending category name to an icon + color pair, using the
// Stitch design's color tokens. Falls back to a neutral pf-secondary treatment
// for categories that don't match a known pattern.
function getCategoryVisual(category: string): { Icon: LucideIcon; bg: string; text: string; border: string } {
    const c = category.toLowerCase();
    if (/food|dining|restaurant|grocery/.test(c)) return { Icon: Utensils, bg: 'bg-pf-primary/10', text: 'text-pf-primary', border: 'border-pf-primary/10' };
    if (/shop|retail|cloth/.test(c)) return { Icon: ShoppingBag, bg: 'bg-tertiary/10', text: 'text-tertiary', border: 'border-tertiary/10' };
    if (/transport|gas|car|fuel|uber/.test(c)) return { Icon: Car, bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/10' };
    if (/entertain|movie|stream|game/.test(c)) return { Icon: Film, bg: 'bg-secondary-container/20', text: 'text-on-secondary-container', border: 'border-white/5' };
    if (/salary|income|freelance|consult/.test(c)) return { Icon: DollarSign, bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/10' };
    return { Icon: CreditCard, bg: 'bg-pf-secondary/10', text: 'text-pf-secondary', border: 'border-white/5' };
}

// Shared card treatment matching the Stitch "glass" panels (see .glass-card in globals.css)
const cardBase = 'glass-card rounded-[2rem]';
const goalBarColors = ['bg-pf-primary', 'bg-green-400', 'bg-tertiary'];
const goalTextColors = ['text-pf-primary', 'text-green-400', 'text-tertiary'];
const chartTooltipStyle = { backgroundColor: '#1d2022', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e0e3e5' };

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

    // 4. Spending Breakdown (this month's expenses grouped by category) — powers
    // the bento-style "Spending Breakdown" panel with real data.
    const spendingBreakdown = useMemo(() => {
        const now = new Date();
        const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const totals: Record<string, number> = {};

        transactions.forEach((t) => {
            if (t.type !== 'expense' || t.status !== 'completed' || t.date < firstOfCurrentMonth) return;
            totals[t.category] = (totals[t.category] || 0) + t.amount;
        });

        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

        return {
            top: sorted.slice(0, 4).map(([category, amount]) => ({ category, amount })),
            mostActive: sorted[0]?.[0] ?? 'N/A'
        };
    }, [transactions]);

    // 5. Net Worth Over Time — reconstructed from real transaction history rather
    // than a stored snapshot. We know today's actual total balance (sum of card
    // balances), so for each of the last 6 months we work backwards, undoing every
    // completed transaction that happened after that month's end to approximate
    // what the balance was at that point in time.
    const netWorthData = useMemo(() => {
        const monthsToShow = 6;
        const now = new Date();
        const currentBalance = cards.reduce((sum, c) => sum + c.balance, 0);
        const points: { label: string; value: number }[] = [];

        for (let i = monthsToShow - 1; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonthStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();

            const netSinceThatPoint = transactions.reduce((sum, t) => {
                if (t.status !== 'completed' || t.date < nextMonthStart) return sum;
                return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            points.push({
                label: monthStart.toLocaleDateString(undefined, { month: 'short' }),
                value: Math.round(currentBalance - netSinceThatPoint)
            });
        }

        return points;
    }, [transactions, cards]);

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
            <span className={`inline-flex items-center text-xs font-bold gap-0.5 px-2 py-1 rounded-lg ${isPositive
                ? 'bg-green-500/15 text-green-400'
                : 'bg-error/15 text-error'
                }`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(value).toFixed(1)}%
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative pb-20">

            {/* Upper Panel: Welcome and CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-on-surface">PocketFlow Financial Command Center</h2>
                    <p className="text-sm text-outline mt-1">
                        Real-time analytics and transaction management system.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddTxOpen(true)}
                    className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-on-primary bg-pf-primary rounded-xl hover:bg-pf-primary-container transition-all shadow-md shadow-pf-primary/20 cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Add Transaction</span>
                </button>
            </div>

            {/* 4 Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Balance — highlighted "spotlight" card, mirrors Stitch's active-border-glow treatment */}
                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36 ring-2 ring-pf-primary/40 shadow-lg shadow-pf-primary/10`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface-variant">Total Balance</span>
                        <div className="p-2 bg-pf-primary/10 rounded-xl text-pf-primary">
                            <WalletIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-bold text-pf-primary tracking-tight">{formatVal(metrics.totalBalance)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.balanceChange)}
                            <span className="text-[11px] text-outline font-semibold uppercase">from last month</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Income */}
                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface-variant">Monthly Income</span>
                        <div className="p-2 bg-green-500/10 rounded-xl text-green-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-bold text-green-400 tracking-tight">{formatVal(metrics.income)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.incomeChange)}
                            <span className="text-[11px] text-outline font-semibold uppercase">from last month</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Expense */}
                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface-variant">Monthly Expenses</span>
                        <div className="p-2 bg-error/10 rounded-xl text-error">
                            <TrendingDown className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-bold text-error tracking-tight">{formatVal(metrics.expense)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.expenseChange)}
                            <span className="text-[11px] text-outline font-semibold uppercase">from last month</span>
                        </div>
                    </div>
                </div>

                {/* Card 4: Savings */}
                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface-variant">Monthly Savings</span>
                        <div className="p-2 bg-pf-primary/10 rounded-xl text-pf-primary">
                            <PiggyBank className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-bold text-pf-primary tracking-tight">{formatVal(metrics.savings)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.savingsChange)}
                            <span className="text-[11px] text-outline font-semibold uppercase">from last month</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Net Worth Over Time & Savings Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Net Worth Chart (2 Columns wide) — real data, reconstructed from transaction history */}
                <div className={`${cardBase} lg:col-span-2 p-5 flex flex-col relative overflow-hidden`}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-bold text-on-surface">Net Worth Over Time</h3>
                            <p className="text-xs text-outline mt-0.5">Reconstructed from your transaction history, last 6 months</p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netWorthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#adc6ff" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#adc6ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8c909f', fontSize: 11 }} />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    // Change 'val' to 'any' or 'number | string'
                                    tickFormatter={(val: any) => typeof val === 'number' ? `$${val}` : val}
                                    tick={{ fill: '#8c909f', fontSize: 11 }}
                                />
                                <Tooltip
                                    contentStyle={chartTooltipStyle}
                                    // Use 'any' for the value to match Recharts internal TooltipPayload definition
                                    formatter={(val: any) => [
                                        typeof val === 'number' ? formatVal(val) : val,
                                        'Balance' // Adding the name (label) here is often required for better rendering
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Net Worth"
                                    stroke="#adc6ff"
                                    strokeWidth={3}
                                    fill="url(#netWorthGradient)"
                                    dot={{ r: 4, fill: '#adc6ff', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#adc6ff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Savings Goals Card (1 Column wide) */}
                <div className={`${cardBase} p-5 flex flex-col`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-on-surface">Savings Goals</h3>
                        <Link href="/goals" className="text-xs font-semibold text-pf-primary hover:underline flex items-center">
                            <span>Details</span>
                            <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Link>
                    </div>

                    <div className="space-y-4 flex-1">
                        {goals.slice(0, 3).map((g, i) => {
                            const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;

                            return (
                                <div key={g.id}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm font-semibold text-on-surface-variant truncate max-w-[140px]">{g.name}</span>
                                        <span className={`text-xs font-bold ${goalTextColors[i % goalTextColors.length]}`}>
                                            {Math.round(ratio)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${goalBarColors[i % goalBarColors.length]}`}
                                            style={{ width: `${Math.min(100, ratio)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-outline mt-1">
                                        ${g.currentAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()}
                                    </p>
                                </div>
                            );
                        })}
                        {goals.length === 0 && (
                            <div className="text-center py-8 text-sm text-outline font-medium">
                                Create your first savings goal.
                            </div>
                        )}
                    </div>

                    <Link
                        href="/goals"
                        className="mt-4 w-full py-2 bg-pf-primary/10 border border-pf-primary/20 rounded-lg text-pf-primary text-sm font-semibold hover:bg-pf-primary/20 transition-all text-center block"
                    >
                        Add New Goal
                    </Link>
                </div>

            </div>

            {/* Row 3: Spending Breakdown & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Spending Breakdown (1 Column wide, real data from this month's expenses) */}
                <div className={`${cardBase} p-5`}>
                    <h3 className="text-base font-bold text-on-surface mb-4">Spending Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {spendingBreakdown.top.map(({ category, amount }) => {
                            const { Icon, bg, text, border } = getCategoryVisual(category);
                            return (
                                <div key={category} className={`${bg} p-3 rounded-xl flex flex-col gap-1.5 border ${border}`}>
                                    <Icon className={`h-5 w-5 ${text}`} />
                                    <span className="text-xs text-outline font-medium truncate">{category}</span>
                                    <span className="text-base font-bold text-on-surface">${amount.toFixed(0)}</span>
                                </div>
                            );
                        })}
                        {spendingBreakdown.top.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-sm text-outline font-medium">
                                No spending recorded this month.
                            </div>
                        )}
                    </div>

                    {spendingBreakdown.top.length > 0 && (
                        <div className="mt-4 p-4 bg-surface-container-highest/30 rounded-xl border border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-outline font-medium">Most Active Category</p>
                                <p className="text-sm font-bold text-on-surface">{spendingBreakdown.mostActive}</p>
                            </div>
                            <Activity className="h-8 w-8 text-pf-primary opacity-50" />
                        </div>
                    )}
                </div>

                {/* Recent Transactions Table (2 Columns wide) */}
                <div className={`${cardBase} lg:col-span-2 p-5 overflow-hidden`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-on-surface">Recent Transactions</h3>
                        <Link href="/transactions" className="text-xs font-semibold text-pf-primary hover:underline flex items-center">
                            <span>See History</span>
                            <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-semibold text-outline border-b border-outline-variant/10">
                                    <th className="pb-2 px-1 font-semibold">Merchant</th>
                                    <th className="pb-2 px-1 font-semibold">Date</th>
                                    <th className="pb-2 px-1 font-semibold">Category</th>
                                    <th className="pb-2 px-1 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-outline-variant/10">
                                {recentTransactions.map((tx) => {
                                    const isIncome = tx.type === 'income';
                                    const card = cards.find(c => c.id === tx.walletId);
                                    const { Icon, bg, text } = getCategoryVisual(tx.category);

                                    return (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-1 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className={`h-4 w-4 ${text}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-on-surface truncate">{tx.recipientName}</p>
                                                    <p className="text-[11px] text-outline truncate">{card?.nickname || 'Account'}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-1 text-on-surface-variant whitespace-nowrap">
                                                {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="py-3 px-1">
                                                <span className="px-2 py-1 rounded bg-surface-container text-xs font-medium text-on-surface-variant whitespace-nowrap">
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className={`py-3 px-1 text-right font-semibold whitespace-nowrap ${isIncome ? 'text-green-400' : 'text-error'}`}>
                                                {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {recentTransactions.length === 0 && (
                            <div className="text-center py-10 text-sm text-outline font-medium">
                                No transactions yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Row 4: Income Analysis — your existing real chart with period tabs, kept and recolored */}
            <div className={`${cardBase} p-5 flex flex-col`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h3 className="text-base font-bold text-on-surface">Income Analysis</h3>
                        <p className="text-xs text-outline mt-0.5">Fixed vs Variable income split over time</p>
                    </div>

                    {/* Period Selector Tabs */}
                    <div className="flex bg-surface-container border border-outline-variant/20 p-1 rounded-xl">
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
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${chartPeriod === p
                                        ? 'bg-pf-primary text-on-primary shadow-sm'
                                        : 'text-outline hover:text-on-surface-variant'
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#8c909f', fontSize: 11 }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${val}`}
                                tick={{ fill: '#8c909f', fontSize: 11 }}
                            />
                            <Tooltip contentStyle={chartTooltipStyle} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10, color: '#c2c6d6' }} />
                            {/* Fixed Income = pf-primary-container, Variable = pf-primary */}
                            <Bar dataKey="Fixed" stackId="a" fill="#4d8eff" radius={[0, 0, 0, 0]} name="Fixed (Salary)" />
                            <Bar dataKey="Variable" stackId="a" fill="#adc6ff" radius={[4, 4, 0, 0]} name="Variable (Consulting/Freelance)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 5: Budget Utilization — not part of the Stitch mockup, designed here in the same
                glass-panel language so it doesn't look bolted on */}
            <div className={`${cardBase} p-5`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-on-surface">Budget Utilization</h3>
                    <Link href="/analytics" className="text-xs font-semibold text-pf-primary hover:underline flex items-center">
                        <span>View All</span>
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {budgets.slice(0, 4).map((b) => {
                        const ratio = b.monthlyLimit > 0 ? (b.spent / b.monthlyLimit) * 100 : 0;
                        let colorClass = 'bg-pf-primary';
                        if (ratio >= 90) colorClass = 'bg-error';
                        else if (ratio >= 75) colorClass = 'bg-tertiary';

                        return (
                            <div key={b.id} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-on-surface-variant">{b.category}</span>
                                    <span className="text-outline">
                                        ${b.spent.toFixed(0)} / <span className="text-on-surface-variant">${b.monthlyLimit}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                                        style={{ width: `${Math.min(100, ratio)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {budgets.length === 0 && (
                        <div className="col-span-full text-center py-8 text-sm text-outline font-medium">
                            No budgets configured.
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button — opens the same Add Transaction modal as the header button */}
            <button
                onClick={() => setIsAddTxOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-pf-primary text-on-primary shadow-2xl shadow-pf-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 hover:bg-pf-primary-container transition-all z-40"
                aria-label="Add transaction"
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Add Transaction Modal component */}
            <AddTransactionModal
                isOpen={isAddTxOpen}
                onClose={() => setIsAddTxOpen(false)}
            />

        </div>
    );
}