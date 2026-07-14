export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  currency: string; // e.g. "USD", "EUR", "PKR", etc.
  monthlySpendingLimit: number;
  createdAt: number;
}

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  walletId: string; // refers to Card/Account id
  recipientName: string;
  status: TransactionStatus;
  date: number; // timestamp
  notes: string | null;
  createdAt: number; // timestamp
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'budget';
  icon: string; // Lucide icon name
}

export type CardType = 'visa' | 'mastercard' | 'amex' | 'other';

export interface Wallet {
  id: string;
  cardNumber: string; // masked, last 4 only e.g. "**** 1234"
  cardHolderName: string;
  expiryDate: string; // MM/YY
  cardType: CardType;
  nickname: string | null;
  balance: number;
  createdAt: number; // timestamp
}

export type Card = Wallet;

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: number; // timestamp
  status: 'active' | 'completed';
  createdAt: number; // timestamp;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
}
