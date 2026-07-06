'use client';

import { create } from 'zustand';
import { User, Transaction, Card, Goal, Budget } from '../types';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface FinanceStore {
  user: User;
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  budgets: Budget[];
  toasts: Toast[];

  // Toasts
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;

  // User Actions
  updateUser: (updates: Partial<User>) => void;

  // Transaction Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  editTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;

  // Card Actions
  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => void;
  editCard: (id: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => void;
  deleteCard: (id: string) => void;

  // Goal Actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'status'>) => void;
  editGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;

  // Budget Actions
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'remaining'>) => void;
  editBudget: (id: string, updates: Partial<Omit<Budget, 'id' | 'spent' | 'remaining'>>) => void;
  deleteBudget: (id: string) => void;
  recalculateBudgets: () => void;
}

const STORAGE_KEY = 'jm_solutionss_finance_data';

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

// Initial state builder helper
const getInitialState = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.user && parsed.transactions && parsed.cards && parsed.goals && parsed.budgets) {
          return { ...parsed, toasts: [] };
        }
      } catch (e) {
        console.error('Error parsing stored finance dashboard data', e);
      }
    }
  }

  // Fallback / Seed Data
  const seedUser: User = {
    id: 'user-1',
    name: 'Taaha Shahid',
    email: 'taahashahid1@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    currency: 'USD',
    monthlySpendingLimit: 4000,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  };

  const seedCards: Card[] = [
    {
      id: 'card-1',
      cardNumber: '**** 4242',
      cardHolderName: 'Taaha Shahid',
      expiryDate: '12/28',
      cardType: 'visa',
      nickname: 'Primary Debit Card',
      balance: 5420.50,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
    },
    {
      id: 'card-2',
      cardNumber: '**** 8899',
      cardHolderName: 'Taaha Shahid',
      expiryDate: '09/27',
      cardType: 'mastercard',
      nickname: 'Savings Reserve',
      balance: 14200.00,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
    },
    {
      id: 'card-3',
      cardNumber: '**** 1001',
      cardHolderName: 'Taaha Shahid',
      expiryDate: '04/29',
      cardType: 'amex',
      nickname: 'Business Travel',
      balance: 1550.00,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
    }
  ];

  const seedGoals: Goal[] = [
    {
      id: 'goal-1',
      name: 'Tesla Model Y Fund',
      targetAmount: 48000,
      currentAmount: 18000,
      deadline: Date.now() + 280 * 24 * 60 * 60 * 1000, // ~9 months
      status: 'active',
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000
    },
    {
      id: 'goal-2',
      name: 'Emergency Fund 6 Months',
      targetAmount: 12000,
      currentAmount: 9500,
      deadline: Date.now() + 90 * 24 * 60 * 60 * 1000, // 3 months
      status: 'active',
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
    },
    {
      id: 'goal-3',
      name: 'Office Upgrades',
      targetAmount: 3500,
      currentAmount: 3500,
      deadline: Date.now() - 4 * 24 * 60 * 60 * 1000, // completed
      status: 'completed',
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
    }
  ];

  // Budgets seed
  const seedBudgets: Budget[] = [
    { id: 'b-1', category: 'Housing', monthlyLimit: 1800, spent: 1500, remaining: 300 },
    { id: 'b-2', category: 'Food & Dining', monthlyLimit: 800, spent: 420.50, remaining: 379.50 },
    { id: 'b-3', category: 'Transportation', monthlyLimit: 400, spent: 175.00, remaining: 225.00 },
    { id: 'b-4', category: 'Entertainment', monthlyLimit: 300, spent: 150.00, remaining: 150.00 },
    { id: 'b-5', category: 'Shopping', monthlyLimit: 600, spent: 310.20, remaining: 289.80 },
    { id: 'b-6', category: 'Utilities', monthlyLimit: 500, spent: 320.00, remaining: 180.00 }
  ];

  // Generate 30 days of transactions
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const seedTransactions: Transaction[] = [
    {
      id: 't-1',
      type: 'income',
      amount: 6800,
      category: 'Salary',
      walletId: 'card-2', // Savings
      recipientName: 'JM Solutionss Corporate',
      status: 'completed',
      date: now - 28 * day,
      notes: 'Monthly corporate base pay',
      createdAt: now - 28 * day
    },
    {
      id: 't-2',
      type: 'expense',
      amount: 1500,
      category: 'Housing',
      walletId: 'card-2',
      recipientName: 'Metropolitan Rentals',
      status: 'completed',
      date: now - 27 * day,
      notes: 'Apartment monthly lease',
      createdAt: now - 27 * day
    },
    {
      id: 't-3',
      type: 'expense',
      amount: 120,
      category: 'Utilities',
      walletId: 'card-1',
      recipientName: 'City Power & Gas',
      status: 'completed',
      date: now - 25 * day,
      notes: 'Electricity billing cycle',
      createdAt: now - 25 * day
    },
    {
      id: 't-4',
      type: 'expense',
      amount: 75.50,
      category: 'Food & Dining',
      walletId: 'card-1',
      recipientName: 'Whole Foods Market',
      status: 'completed',
      date: now - 20 * day,
      notes: 'Weekly grocery items',
      createdAt: now - 20 * day
    },
    {
      id: 't-5',
      type: 'income',
      amount: 1500,
      category: 'Consulting',
      walletId: 'card-1',
      recipientName: 'TechVenture Partners',
      status: 'completed',
      date: now - 18 * day,
      notes: 'Advisory deliverables milestone',
      createdAt: now - 18 * day
    },
    {
      id: 't-6',
      type: 'expense',
      amount: 85,
      category: 'Transportation',
      walletId: 'card-1',
      recipientName: 'Chevron Fuel',
      status: 'completed',
      date: now - 16 * day,
      notes: 'Gas tank refill',
      createdAt: now - 16 * day
    },
    {
      id: 't-7',
      type: 'expense',
      amount: 19.99,
      category: 'Utilities',
      walletId: 'card-1',
      recipientName: 'Netflix',
      status: 'completed',
      date: now - 15 * day,
      notes: 'Premium 4K plan subscription',
      createdAt: now - 15 * day
    },
    {
      id: 't-8',
      type: 'expense',
      amount: 110.20,
      category: 'Shopping',
      walletId: 'card-1',
      recipientName: 'Amazon',
      status: 'completed',
      date: now - 12 * day,
      notes: 'Office stationery and supplies',
      createdAt: now - 12 * day
    },
    {
      id: 't-9',
      type: 'expense',
      amount: 150,
      category: 'Entertainment',
      walletId: 'card-3', // Business Card
      recipientName: 'Golf Club House',
      status: 'completed',
      date: now - 10 * day,
      notes: 'Client entertainment lunch',
      createdAt: now - 10 * day
    },
    {
      id: 't-10',
      type: 'expense',
      amount: 200,
      category: 'Shopping',
      walletId: 'card-1',
      recipientName: 'Nike Retail',
      status: 'completed',
      date: now - 8 * day,
      notes: 'Running sneakers replacement',
      createdAt: now - 8 * day
    },
    {
      id: 't-11',
      type: 'expense',
      amount: 180,
      category: 'Utilities',
      walletId: 'card-1',
      recipientName: 'Comcast Broadband',
      status: 'completed',
      date: now - 5 * day,
      notes: 'Gigabit office internet access',
      createdAt: now - 5 * day
    },
    {
      id: 't-12',
      type: 'expense',
      amount: 90,
      category: 'Transportation',
      walletId: 'card-1',
      recipientName: 'Tesla Supercharger',
      status: 'completed',
      date: now - 3 * day,
      notes: 'Supercharger station power',
      createdAt: now - 3 * day
    },
    {
      id: 't-13',
      type: 'expense',
      amount: 345,
      category: 'Food & Dining',
      walletId: 'card-1',
      recipientName: 'The Ocean Grill',
      status: 'completed',
      date: now - 1 * day,
      notes: 'Team recognition dinner',
      createdAt: now - 1 * day
    },
    {
      id: 't-14',
      type: 'income',
      amount: 2200,
      category: 'Freelance',
      walletId: 'card-1',
      recipientName: 'Apex Web Design LLC',
      status: 'completed',
      date: now - 12 * hour,
      notes: 'Landing page development deploy',
      createdAt: now - 12 * hour
    }
  ];

  return {
    user: seedUser,
    cards: seedCards,
    goals: seedGoals,
    budgets: seedBudgets,
    transactions: seedTransactions,
    toasts: []
  };
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  ...getInitialState(),

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
  })),

  // User Actions
  updateUser: (updates) => set((state) => {
    const newUser = { ...state.user, ...updates };
    const nextState = { ...state, user: newUser };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: nextState.user,
      transactions: nextState.transactions,
      cards: nextState.cards,
      goals: nextState.goals,
      budgets: nextState.budgets
    }));
    return { user: newUser };
  }),

  // Transaction Actions
  addTransaction: (txData) => set((state) => {
    const id = 't-' + Math.random().toString(36).substring(2, 9);
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: Date.now()
    };

    // Adjust Card balance
    const updatedCards = state.cards.map((card) => {
      if (card.id === txData.walletId) {
        const delta = txData.type === 'income' ? txData.amount : -txData.amount;
        return { ...card, balance: card.balance + delta };
      }
      return card;
    });

    const updatedTxs = [newTx, ...state.transactions];

    // Compute updated budgets
    const nextState = {
      ...state,
      transactions: updatedTxs,
      cards: updatedCards
    };

    const finalState = recalculateBudgetsHelper(nextState);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: finalState.user,
      transactions: finalState.transactions,
      cards: finalState.cards,
      goals: finalState.goals,
      budgets: finalState.budgets
    }));

    return finalState;
  }),

  editTransaction: (id, updates) => set((state) => {
    const originalTx = state.transactions.find(t => t.id === id);
    if (!originalTx) return {};

    // 1. Revert original transaction card balance
    let updatedCards = state.cards.map((card) => {
      if (card.id === originalTx.walletId) {
        const delta = originalTx.type === 'income' ? -originalTx.amount : originalTx.amount;
        return { ...card, balance: card.balance + delta };
      }
      return card;
    });

    // 2. Apply new transaction details and adjust new card balance
    const nextWalletId = updates.walletId !== undefined ? updates.walletId : originalTx.walletId;
    const nextType = updates.type !== undefined ? updates.type : originalTx.type;
    const nextAmount = updates.amount !== undefined ? updates.amount : originalTx.amount;

    updatedCards = updatedCards.map((card) => {
      if (card.id === nextWalletId) {
        const delta = nextType === 'income' ? nextAmount : -nextAmount;
        return { ...card, balance: card.balance + delta };
      }
      return card;
    });

    const updatedTxs = state.transactions.map((tx) => {
      if (tx.id === id) {
        return { ...tx, ...updates };
      }
      return tx;
    });

    const nextState = {
      ...state,
      transactions: updatedTxs,
      cards: updatedCards
    };

    const finalState = recalculateBudgetsHelper(nextState);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: finalState.user,
      transactions: finalState.transactions,
      cards: finalState.cards,
      goals: finalState.goals,
      budgets: finalState.budgets
    }));

    return finalState;
  }),

  deleteTransaction: (id) => set((state) => {
    const originalTx = state.transactions.find(t => t.id === id);
    if (!originalTx) return {};

    // Revert balance impact
    const updatedCards = state.cards.map((card) => {
      if (card.id === originalTx.walletId) {
        const delta = originalTx.type === 'income' ? -originalTx.amount : originalTx.amount;
        return { ...card, balance: card.balance + delta };
      }
      return card;
    });

    const updatedTxs = state.transactions.filter(t => t.id !== id);

    const nextState = {
      ...state,
      transactions: updatedTxs,
      cards: updatedCards
    };

    const finalState = recalculateBudgetsHelper(nextState);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: finalState.user,
      transactions: finalState.transactions,
      cards: finalState.cards,
      goals: finalState.goals,
      budgets: finalState.budgets
    }));

    return finalState;
  }),

  // Card Actions
  addCard: (cardData) => set((state) => {
    const id = 'card-' + Math.random().toString(36).substring(2, 9);
    const newCard: Card = {
      ...cardData,
      id,
      createdAt: Date.now()
    };
    const updatedCards = [...state.cards, newCard];

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      transactions: state.transactions,
      cards: updatedCards,
      goals: state.goals,
      budgets: state.budgets
    }));

    return { cards: updatedCards };
  }),

  editCard: (id, updates) => set((state) => {
    const updatedCards = state.cards.map((card) => {
      if (card.id === id) {
        return { ...card, ...updates };
      }
      return card;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      transactions: state.transactions,
      cards: updatedCards,
      goals: state.goals,
      budgets: state.budgets
    }));

    return { cards: updatedCards };
  }),

  deleteCard: (id) => set((state) => {
    // Note: In real cases, deleting card deletes its associated transactions or sets walletId null.
    // Here we just filter the card out.
    const updatedCards = state.cards.filter(c => c.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      transactions: state.transactions,
      cards: updatedCards,
      goals: state.goals,
      budgets: state.budgets
    }));

    return { cards: updatedCards };
  }),

  // Goal Actions
  addGoal: (goalData) => set((state) => {
    const id = 'goal-' + Math.random().toString(36).substring(2, 9);
    const newGoal: Goal = {
      ...goalData,
      id,
      status: goalData.currentAmount >= goalData.targetAmount ? 'completed' : 'active',
      createdAt: Date.now()
    };
    const updatedGoals = [...state.goals, newGoal];

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      transactions: state.transactions,
      cards: state.cards,
      goals: updatedGoals,
      budgets: state.budgets
    }));

    return { goals: updatedGoals };
  }),

  editGoal: (id, updates) => set((state) => {
    const updatedGoals = state.goals.map((g) => {
      if (g.id === id) {
        const merged = { ...g, ...updates };
        const status = merged.currentAmount >= merged.targetAmount ? 'completed' : 'active';
        return { ...merged, status } as Goal;
      }
      return g;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      transactions: state.transactions,
      cards: state.cards,
      goals: updatedGoals,
      budgets: state.budgets
    }));

    return { goals: updatedGoals };
  }),

  deleteGoal: (id) => set((state) => {
    const updatedGoals = state.goals.filter(g => g.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      transactions: state.transactions,
      cards: state.cards,
      goals: updatedGoals,
      budgets: state.budgets
    }));

    return { goals: updatedGoals };
  }),

  contributeToGoal: (id, amount) => set((state) => {
    // Verify amount and deduct from main wallet if possible
    const primaryCard = state.cards[0];
    if (!primaryCard || primaryCard.balance < amount) {
      // Allow contribution anyway for simplicity, or fail?
      // We will allow but deduct from primary card
    }

    const updatedCards = state.cards.map((card, index) => {
      if (index === 0) {
        return { ...card, balance: Math.max(0, card.balance - amount) };
      }
      return card;
    });

    const updatedGoals = state.goals.map((g) => {
      if (g.id === id) {
        const nextAmount = g.currentAmount + amount;
        const status = nextAmount >= g.targetAmount ? 'completed' : 'active';
        return { ...g, currentAmount: nextAmount, status } as Goal;
      }
      return g;
    });

    // Generate a transaction matching the contribution
    const txId = 't-' + Math.random().toString(36).substring(2, 9);
    const targetGoal = state.goals.find(g => g.id === id);
    const newTx: Transaction = {
      id: txId,
      type: 'expense',
      amount,
      category: 'Shopping',
      walletId: primaryCard?.id || 'card-1',
      recipientName: `Savings Goal: ${targetGoal?.name || 'Contribution'}`,
      status: 'completed',
      date: Date.now(),
      notes: `Dedicated savings contribution to ${targetGoal?.name}`,
      createdAt: Date.now()
    };

    const updatedTxs = [newTx, ...state.transactions];

    const nextState = {
      ...state,
      cards: updatedCards,
      goals: updatedGoals,
      transactions: updatedTxs
    };

    const finalState = recalculateBudgetsHelper(nextState);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: finalState.user,
      transactions: finalState.transactions,
      cards: finalState.cards,
      goals: finalState.goals,
      budgets: finalState.budgets
    }));

    return finalState;
  }),

  // Budget Actions
  addBudget: (budgetData) => set((state) => {
    const id = 'b-' + Math.random().toString(36).substring(2, 9);
    const newBudget: Budget = {
      ...budgetData,
      id,
      spent: 0,
      remaining: budgetData.monthlyLimit
    };
    const nextState = {
      ...state,
      budgets: [...state.budgets, newBudget]
    };
    const finalState = recalculateBudgetsHelper(nextState);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: finalState.user,
      transactions: finalState.transactions,
      cards: finalState.cards,
      goals: finalState.goals,
      budgets: finalState.budgets
    }));

    return finalState;
  }),

  editBudget: (id, updates) => set((state) => {
    const updatedBudgets = state.budgets.map((b) => {
      if (b.id === id) {
        const monthlyLimit = updates.monthlyLimit !== undefined ? updates.monthlyLimit : b.monthlyLimit;
        return {
          ...b,
          category: updates.category !== undefined ? updates.category : b.category,
          monthlyLimit,
          remaining: monthlyLimit - b.spent
        };
      }
      return b;
    });

    const nextState = { ...state, budgets: updatedBudgets };
    const finalState = recalculateBudgetsHelper(nextState);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: finalState.user,
      transactions: finalState.transactions,
      cards: finalState.cards,
      goals: finalState.goals,
      budgets: finalState.budgets
    }));

    return finalState;
  }),

  deleteBudget: (id) => set((state) => {
    const updatedBudgets = state.budgets.filter(b => b.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      transactions: state.transactions,
      cards: state.cards,
      goals: state.goals,
      budgets: updatedBudgets
    }));

    return { budgets: updatedBudgets };
  }),

  recalculateBudgets: () => set((state) => {
    const finalState = recalculateBudgetsHelper(state);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: finalState.user,
      transactions: finalState.transactions,
      cards: finalState.cards,
      goals: finalState.goals,
      budgets: finalState.budgets
    }));

    return finalState;
  })
}));

// Reusable function to calculate spending by category for the current month
function recalculateBudgetsHelper(state: {
  user: User;
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  budgets: Budget[];
}): typeof state {
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const startTimestamp = currentMonthStart.getTime();

  // Accumulate expense transactions in the current month per category
  const spendingMap: Record<string, number> = {};

  state.transactions.forEach((tx) => {
    if (tx.type === 'expense' && tx.date >= startTimestamp && tx.status === 'completed') {
      const cat = tx.category;
      spendingMap[cat] = (spendingMap[cat] || 0) + tx.amount;
    }
  });

  const updatedBudgets = state.budgets.map((b) => {
    const spent = spendingMap[b.category] || 0;
    return {
      ...b,
      spent,
      remaining: b.monthlyLimit - spent
    };
  });

  return {
    ...state,
    budgets: updatedBudgets
  };
}
