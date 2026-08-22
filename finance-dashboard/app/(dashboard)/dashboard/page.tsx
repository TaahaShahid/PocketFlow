'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore, CATEGORIES } from '../../../hooks/useFinanceStore';
import { Card as WalletCard } from '../../../types';
import { useWallets } from '@/context/WalletContext';
import { useTransactions } from '@/context/TransactionContext';
import { useGoals } from '@/context/GoalContext';
import { useBudgets } from '@/context/BudgetContext';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, Plus, PiggyBank, DollarSign, TrendingUp, TrendingDown, ChevronRight, Activity, Utensils, ShoppingBag, Car, Film, CreditCard, X, Calendar, User, Tag, Layers, LucideIcon, BrainCircuit, Sparkles, Send, Bot } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { api } from '@/lib/api/client';

// Quick Custom Transaction Modal for instant data input
function AddTransactionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { wallets: cards } = useWallets();
    const { addTransaction } = useTransactions();
    const { addToast } = useFinanceStore();
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [walletId, setWalletId] = useState('');
    const [recipient, setRecipient] = useState('');
    const notes = '';
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop mask */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-lg overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold tracking-tight">Add Transaction</h2>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Selector */}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Type</label>
                                <div className="grid grid-cols-2 gap-2 bg-muted/15 p-1 rounded-xl border border-border">
                                    <button
                                        type="button"
                                        onClick={() => { setType('expense'); setCategory(''); }}
                                        className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${type === 'expense'
                                            ? 'bg-destructive text-destructive-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setType('income'); setCategory(''); }}
                                        className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${type === 'income'
                                            ? 'bg-green-500 text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>

                            {/* Amount & Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5" /> Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                                        ${errors.amount ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                                    />
                                    {errors.amount && (
                                        <p className="text-rose-500 text-xs mt-1">{errors.amount}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> Date
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                                        ${errors.date ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                                    />
                                    {errors.date && (
                                        <p className="text-rose-500 text-xs mt-1">{errors.date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Category select */}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5" /> Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                                    ${errors.category ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                                >
                                    <option value="" className="bg-card">Select Category</option>
                                    {currentCategories.map((c: { name: string }) => (
                                        <option key={c.name} value={c.name} className="bg-card">
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <p className="text-rose-500 text-xs mt-1">{errors.category}</p>
                                )}
                            </div>

                            {/* Wallet / Account select */}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5" /> Account
                                </label>
                                <select
                                    value={walletId}
                                    onChange={(e) => setWalletId(e.target.value)}
                                    className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                                    ${errors.walletId ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                                >
                                    <option value="" className="bg-card">Select Account</option>
                                    {cards.map((c: WalletCard) => (
                                        <option key={c.id} value={c.id} className="bg-card">
                                            {c.nickname} (${c.balance.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                                {errors.walletId && (
                                    <p className="text-rose-500 text-xs mt-1">{errors.walletId}</p>
                                )}
                            </div>

                            {/* Recipient */}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" /> Payee / Recipient
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Starbucks, Salary, Amazon"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className={`w-full h-10 px-3.5 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                                    ${errors.recipient ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                                />
                                {errors.recipient && (
                                    <p className="text-rose-500 text-xs mt-1">{errors.recipient}</p>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-border">
                                <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
                                <Button type="submit" className="rounded-xl shadow-md">Add Transaction</Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Maps a transaction/spending category name to an icon + color pair, using
// design color tokens.
function getCategoryVisual(category: string): { Icon: LucideIcon; bg: string; text: string; border: string } {
    const c = category.toLowerCase();
    if (/food|dining|restaurant|grocery/.test(c)) return { Icon: Utensils, bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/10' };
    if (/shop|retail|cloth/.test(c)) return { Icon: ShoppingBag, bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/10' };
    if (/transport|gas|car|fuel|uber/.test(c)) return { Icon: Car, bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/10' };
    if (/entertain|movie|stream|game/.test(c)) return { Icon: Film, bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/10' };
    if (/salary|income|freelance|consult/.test(c)) return { Icon: DollarSign, bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/10' };
    return { Icon: CreditCard, bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/10' };
}

const cardBase = "rounded-3xl border border-border bg-card/45 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/10";
const goalBarColors = ['bg-primary', 'bg-emerald-500', 'bg-rose-500'];
const goalTextColors = ['text-primary', 'text-emerald-500', 'text-rose-500'];
const chartTooltipStyle = { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--foreground)' };

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

function AIChatDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const suggestedQuestions = [
        "Where did most of my money go?",
        "How much did I spend this month?",
        "How am I doing with my budgets?",
        "What changed from last month?",
        "How can I reduce my spending?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || loading) return;
        const userMessage: ChatMessage = { sender: 'user', text: text.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/insights/chat', { message: text.trim() });
            const aiMessage: ChatMessage = { sender: 'ai', text: response.data.answer };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            console.error('AI Assistant Error:', err);
            setError('Failed to reach AI assistant. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop mask */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Chat Drawer container */}
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                        className="relative w-full max-w-md h-full bg-card/95 border-l border-border/40 text-foreground shadow-2xl flex flex-col justify-between z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-border/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-pf-primary/10 rounded-xl text-pf-primary">
                              <Sparkles className="h-5 w-5 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold leading-none">PocketFlow AI Assistant</h3>
                              <span className="text-[10px] text-on-surface-variant mt-1.5 block font-medium">Powered by Gemini 3.6 Flash</span>
                            </div>
                          </div>
                          <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                            title="Close Assistant"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Conversation list */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                          {messages.length === 0 ? (
                            /* Empty state */
                            <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-6">
                              <div className="p-4 bg-pf-primary/5 rounded-full border border-pf-primary/10 text-pf-primary">
                                <Bot className="h-10 w-10" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">PocketFlow Intelligence</h4>
                                <p className="text-xs text-on-surface-variant max-w-xs mt-1.5 leading-relaxed font-semibold">
                                  I can help you review your budgets, categories, recent transactions, and wallet balances using real-time details.
                                </p>
                              </div>

                              {/* Suggestions list */}
                              <div className="w-full space-y-2 pt-2">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block text-left px-1">
                                  Suggested Questions
                                </span>
                                <div className="grid grid-cols-1 gap-2">
                                  {suggestedQuestions.map((q) => (
                                    <button
                                      key={q}
                                      onClick={() => handleSendMessage(q)}
                                      className="w-full text-left px-4 py-2.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-pf-primary/5 hover:border-pf-primary/20 transition-all text-xs font-semibold text-foreground/90 cursor-pointer"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Chat Messages */
                            <div className="space-y-4 flex flex-col">
                              {messages.map((m, idx) => {
                                const isUser = m.sender === 'user';
                                return (
                                  <div
                                    key={idx}
                                    className={`flex flex-col max-w-[85%] ${
                                      isUser ? 'self-end items-end' : 'self-start items-start'
                                    }`}
                                  >
                                    <div
                                      className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                                        isUser
                                          ? 'bg-pf-primary text-white rounded-tr-none'
                                          : 'bg-muted/40 text-foreground border border-border/10 rounded-tl-none'
                                      }`}
                                    >
                                      {m.text}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Loading response state */}
                              {loading && (
                                <div className="flex flex-col items-start self-start max-w-[80%]">
                                  <div className="bg-muted/40 border border-border/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-pf-primary" />
                                    <span className="text-[10px] font-semibold text-muted-foreground">Formulating financial response...</span>
                                  </div>
                                </div>
                              )}

                              {/* Error state */}
                              {error && (
                                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-500 text-xs font-medium">
                                  {error}
                                </div>
                              )}

                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </div>

                        {/* Input area */}
                        <div className="p-4 border-t border-border/20 bg-muted/5">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendMessage(input);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              disabled={loading}
                              placeholder="Ask a question about your money..."
                              className="flex-1 bg-muted/40 border border-border/40 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-pf-primary/40 disabled:opacity-50"
                            />
                            <button
                              type="submit"
                              disabled={loading || !input.trim()}
                              className="p-2.5 bg-pf-primary hover:bg-pf-primary/95 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                              title="Send message"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default function Dashboard() {
    const { transactions, loading: txLoading } = useTransactions();
    const { wallets: cards, loading: walletsLoading } = useWallets();
    const { goals, loading: goalsLoading } = useGoals();
    const { budgets, loading: budgetsLoading } = useBudgets();

    const loading = txLoading || walletsLoading || goalsLoading || budgetsLoading;

    const [chartPeriod, setChartPeriod] = useState<'this-month' | 'last-3' | 'last-6' | 'this-year'>('this-month');
    const [isAddTxOpen, setIsAddTxOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(true);

    useEffect(() => {
        async function fetchAISummary() {
            try {
                const response = await api.get('/insights/ai-narrative?period=month');
                const summary = response.data?.summary;
                if (summary && !summary.includes("encountered an issue")) {
                    setAiSummary(summary);
                } else {
                    setAiSummary(null);
                }
            } catch (err) {
                console.error('Error fetching AI Summary on dashboard:', err);
                setAiSummary(null);
            } finally {
                setAiLoading(false);
            }
        }
        fetchAISummary();
    }, []);

    // 1. Calculate Key Metrics
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

        const getChange = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

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

                const weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
                const isFixed = t.category === 'Salary';

                if (isFixed) {
                    data[weekIndex].Fixed += t.amount;
                } else {
                    data[weekIndex].Variable += t.amount;
                }
            });
            return data;
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthDataMap: Record<string, { label: string; Fixed: number; Variable: number; order: number }> = {};

        const iter = new Date(startDate);
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

    // 4. Spending Breakdown
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

    // 5. Net Worth Over Time
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
            <span className={`inline-flex items-center text-xs font-bold gap-0.5 px-2 py-0.5 rounded-lg ${isPositive
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-destructive/15 text-destructive'
                }`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(value).toFixed(1)}%
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative pb-20">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">PocketFlow Financial Command Center</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Real-time analytics and transaction management system.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        onClick={() => setIsAIChatOpen(true)}
                        variant="outline"
                        className="rounded-xl border-pf-primary/20 text-pf-primary hover:bg-pf-primary/5 hover:text-pf-primary gap-1.5 cursor-pointer"
                    >
                        <Sparkles className="h-4 w-4 animate-pulse" /> AI Assistant
                    </Button>
                    <Button
                        onClick={() => setIsAddTxOpen(true)}
                        className="rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
                    >
                        <Plus className="h-4.5 w-4.5" /> Add Transaction
                    </Button>
                </div>
            </div>

            {/* AI Summary Banner */}
            {!aiLoading && aiSummary && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-pf-primary/20 bg-gradient-to-r from-pf-primary/5 via-purple-500/5 to-card/5 backdrop-blur-xl shadow-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-pf-primary/10 rounded-xl text-pf-primary mt-0.5 shrink-0">
                            <BrainCircuit className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-pf-primary">PocketFlow AI Assistant</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                            <p className="text-xs font-semibold text-foreground/90 mt-1 leading-relaxed">
                                {aiSummary}
                            </p>
                        </div>
                    </div>
                    <Link href="/insights" className="shrink-0">
                        <Button variant="outline" size="sm" className="rounded-xl border-pf-primary/20 text-pf-primary hover:bg-pf-primary/5 hover:text-pf-primary text-xs font-bold gap-1 cursor-pointer">
                            <span>Detailed Insights</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </motion.div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36 border-primary/20 bg-primary/5 shadow-md shadow-primary/5`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">Total Balance</span>
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <WalletIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{formatVal(metrics.totalBalance)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.balanceChange)}
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">from last month</span>
                        </div>
                    </div>
                </div>

                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">Monthly Income</span>
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{formatVal(metrics.income)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.incomeChange)}
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">from last month</span>
                        </div>
                    </div>
                </div>

                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">Monthly Expenses</span>
                        <div className="p-2 bg-destructive/10 rounded-xl text-destructive">
                            <TrendingDown className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{formatVal(metrics.expense)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.expenseChange)}
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">from last month</span>
                        </div>
                    </div>
                </div>

                <div className={`${cardBase} p-5 flex flex-col justify-between min-h-36`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">Monthly Savings</span>
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <PiggyBank className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{formatVal(metrics.savings)}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {renderTrend(metrics.savingsChange)}
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">from last month</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Worth & Savings Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${cardBase} lg:col-span-2 p-5 flex flex-col relative overflow-hidden`}>
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-foreground">Net Worth Over Time</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Reconstructed from your transaction history, last 6 months</p>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netWorthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8c909f', fontSize: 11 }} />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                    tick={{ fill: '#8c909f', fontSize: 11 }}
                                />
                                <Tooltip
                                    contentStyle={chartTooltipStyle}
                                    formatter={(val: unknown) => [
                                        typeof val === 'number' ? formatVal(val) : String(val),
                                        'Balance'
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Net Worth"
                                    stroke="var(--primary)"
                                    strokeWidth={3}
                                    fill="url(#netWorthGradient)"
                                    dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: "var(--primary)" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Savings Goals */}
                <div className={`${cardBase} p-5 flex flex-col`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-foreground">Savings Goals</h3>
                        <Link href="/goals" className="text-xs font-semibold text-primary hover:underline flex items-center">
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
                                        <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">{g.name}</span>
                                        <span className={`text-xs font-bold ${goalTextColors[i % goalTextColors.length]}`}>
                                            {Math.round(ratio)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${goalBarColors[i % goalBarColors.length]}`}
                                            style={{ width: `${Math.min(100, ratio)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                                        ${g.currentAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()}
                                    </p>
                                </div>
                            );
                        })}
                        {goals.length === 0 && (
                            <div className="text-center py-8 text-sm text-muted-foreground font-medium">
                                Create your first savings goal.
                            </div>
                        )}
                    </div>

                    <Link
                        href="/goals"
                        className="mt-4 w-full py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-semibold hover:bg-primary/20 transition-all text-center block"
                    >
                        Add New Goal
                    </Link>
                </div>
            </div>

            {/* Spending Breakdown & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spending Breakdown */}
                <div className={`${cardBase} p-5`}>
                    <h3 className="text-base font-bold text-foreground mb-4">Spending Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {spendingBreakdown.top.map(({ category, amount }) => {
                            const { Icon, bg, text, border } = getCategoryVisual(category);
                            return (
                                <div key={category} className={`${bg} p-3 rounded-2xl flex flex-col gap-1.5 border ${border}`}>
                                    <Icon className={`h-4.5 w-4.5 ${text}`} />
                                    <span className="text-xs text-muted-foreground font-medium truncate">{category}</span>
                                    <span className="text-base font-bold text-foreground">${amount.toFixed(0)}</span>
                                </div>
                            );
                        })}
                        {spendingBreakdown.top.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-sm text-muted-foreground font-medium">
                                No spending recorded this month.
                            </div>
                        )}
                    </div>

                    {spendingBreakdown.top.length > 0 && (
                        <div className="mt-4 p-4 bg-muted/10 rounded-2xl border border-border flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Most Active Category</p>
                                <p className="text-sm font-bold text-foreground mt-0.5">{spendingBreakdown.mostActive}</p>
                            </div>
                            <Activity className="h-7 w-7 text-primary opacity-60 animate-pulse" />
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className={`${cardBase} lg:col-span-2 p-5 overflow-hidden`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-foreground">Recent Transactions</h3>
                        <Link href="/transactions" className="text-xs font-semibold text-primary hover:underline flex items-center">
                            <span>See History</span>
                            <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                                    <th className="pb-2 px-1 uppercase tracking-wider">Merchant</th>
                                    <th className="pb-2 px-1 uppercase tracking-wider">Date</th>
                                    <th className="pb-2 px-1 uppercase tracking-wider">Category</th>
                                    <th className="pb-2 px-1 text-right uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-border/40">
                                {recentTransactions.map((tx) => {
                                    const isIncome = tx.type === 'income';
                                    const card = cards.find(c => c.id === tx.walletId);
                                    const { Icon, bg, text } = getCategoryVisual(tx.category);

                                    return (
                                        <tr key={tx.id} className="hover:bg-muted/5 transition-colors">
                                            <td className="py-3 px-1 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className={`h-4 w-4 ${text}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">{tx.recipientName}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{card?.nickname || 'Account'}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-1 text-muted-foreground whitespace-nowrap">
                                                {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="py-3 px-1">
                                                <span className="px-2 py-0.5 rounded bg-muted/15 border border-border text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className={`py-3 px-1 text-right font-bold whitespace-nowrap ${isIncome ? 'text-emerald-500' : 'text-destructive'}`}>
                                                {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {recentTransactions.length === 0 && (
                            <div className="text-center py-10 text-sm text-muted-foreground font-medium">
                                No transactions yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Income Analysis */}
            <div className={`${cardBase} p-5 flex flex-col`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h3 className="text-base font-bold text-foreground">Income Analysis</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Fixed vs Variable income split over time</p>
                    </div>

                    {/* Period Selector Tabs */}
                    <div className="flex bg-muted/10 border border-border p-1 rounded-xl">
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
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartPeriod === p
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
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
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10, color: 'var(--muted-foreground)' }} />
                            <Bar dataKey="Fixed" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} name="Fixed (Salary)" />
                            <Bar dataKey="Variable" stackId="a" fill="var(--secondary)" radius={[4, 4, 0, 0]} name="Variable (Freelance/Consulting)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Budget Utilization */}
            <div className={`${cardBase} p-5`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-foreground">Budget Utilization</h3>
                    <Link href="/analytics" className="text-xs font-semibold text-primary hover:underline flex items-center">
                        <span>View All</span>
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {budgets.slice(0, 4).map((b) => {
                        const ratio = b.monthlyLimit > 0 ? (b.spent / b.monthlyLimit) * 100 : 0;
                        let colorClass = 'bg-primary';
                        if (ratio >= 90) colorClass = 'bg-destructive';
                        else if (ratio >= 75) colorClass = 'bg-amber-500';

                        return (
                            <div key={b.id} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-foreground">{b.category}</span>
                                    <span className="text-muted-foreground">
                                        ${b.spent.toFixed(0)} / <span className="text-foreground">${b.monthlyLimit}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                                        style={{ width: `${Math.min(100, ratio)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {budgets.length === 0 && (
                        <div className="col-span-full text-center py-8 text-sm text-muted-foreground font-medium">
                            No budgets configured.
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsAddTxOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
                aria-label="Add transaction"
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={isAddTxOpen}
                onClose={() => setIsAddTxOpen(false)}
            />

            {/* AI Financial Assistant Chat Drawer */}
            <AIChatDrawer
                isOpen={isAIChatOpen}
                onClose={() => setIsAIChatOpen(false)}
            />
        </div>
    );
}