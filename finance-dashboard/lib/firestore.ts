import { db } from "./firebase";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { Wallet, Transaction, Goal, Budget } from "@/types";

export const initializeUser = async (
    uid: string,
    email: string | null,
    displayName: string | null
) => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            displayName: displayName ?? "",
            email: email ?? "",
            currency: "USD",
            theme: "dark",
            createdAt: Date.now(),

            settings: {
                currency: "USD",
                notifications: {
                    budgetAlerts: true,
                    goalAlerts: true,
                    monthlySummary: true,
                    transactionAlerts: true,
                },
            },
        });

        // Seed data
        const seedCards: Omit<Wallet, "id">[] = [
            {
                cardNumber: '**** 4242',
                cardHolderName: displayName ?? 'User',
                expiryDate: '12/28',
                cardType: 'visa',
                nickname: 'Primary Debit Card',
                balance: 5420.50,
                createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
            },
            {
                cardNumber: '**** 8899',
                cardHolderName: displayName ?? 'User',
                expiryDate: '09/27',
                cardType: 'mastercard',
                nickname: 'Savings Reserve',
                balance: 14200.00,
                createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
            },
            {
                cardNumber: '**** 1001',
                cardHolderName: displayName ?? 'User',
                expiryDate: '04/29',
                cardType: 'amex',
                nickname: 'Business Travel',
                balance: 1550.00,
                createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
            }
        ];

        for (let i = 0; i < seedCards.length; i++) {
            await setDoc(doc(db, "users", uid, "wallets", `card-${i + 1}`), seedCards[i]);
        }

        const seedGoals: Omit<Goal, "id">[] = [
            {
                name: 'Tesla Model Y Fund',
                targetAmount: 48000,
                currentAmount: 18000,
                deadline: Date.now() + 280 * 24 * 60 * 60 * 1000,
                status: 'active',
                createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000
            },
            {
                name: 'Emergency Fund 6 Months',
                targetAmount: 12000,
                currentAmount: 9500,
                deadline: Date.now() + 90 * 24 * 60 * 60 * 1000,
                status: 'active',
                createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
            },
            {
                name: 'Office Upgrades',
                targetAmount: 3500,
                currentAmount: 3500,
                deadline: Date.now() - 4 * 24 * 60 * 60 * 1000,
                status: 'completed',
                createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
            }
        ];

        for (let i = 0; i < seedGoals.length; i++) {
            await setDoc(doc(db, "users", uid, "goals", `goal-${i + 1}`), seedGoals[i]);
        }

        const seedBudgets: Omit<Budget, "id">[] = [
            { category: 'Housing', monthlyLimit: 1800, spent: 1500, remaining: 300 },
            { category: 'Food & Dining', monthlyLimit: 800, spent: 420.50, remaining: 379.50 },
            { category: 'Transportation', monthlyLimit: 400, spent: 175.00, remaining: 225.00 },
            { category: 'Entertainment', monthlyLimit: 300, spent: 150.00, remaining: 150.00 },
            { category: 'Shopping', monthlyLimit: 600, spent: 310.20, remaining: 289.80 },
            { category: 'Utilities', monthlyLimit: 500, spent: 320.00, remaining: 180.00 }
        ];

        for (let i = 0; i < seedBudgets.length; i++) {
            await setDoc(doc(db, "users", uid, "budgets", `b-${i + 1}`), seedBudgets[i]);
        }

        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const hour = 60 * 60 * 1000;
        const seedTransactions: Omit<Transaction, "id">[] = [
            {
                type: 'income',
                amount: 6800,
                category: 'Salary',
                walletId: 'card-2',
                recipientName: 'JM Solutionss Corporate',
                status: 'completed',
                date: now - 28 * day,
                notes: 'Monthly corporate base pay',
                createdAt: now - 28 * day
            },
            {
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
                type: 'expense',
                amount: 150,
                category: 'Entertainment',
                walletId: 'card-3',
                recipientName: 'Golf Club House',
                status: 'completed',
                date: now - 10 * day,
                notes: 'Client entertainment lunch',
                createdAt: now - 10 * day
            },
            {
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

        for (let i = 0; i < seedTransactions.length; i++) {
            await setDoc(doc(db, "users", uid, "transactions", `t-${i + 1}`), seedTransactions[i]);
        }
    }
};

export const getUserData = async (uid: string) => {
    if (!uid) return null;

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data();
    }

    return null;
};

// Wallets CRUD
export const getWallets = async (uid: string): Promise<Wallet[]> => {
    if (!uid) return [];

    const snapshot = await getDocs(
        collection(db, "users", uid, "wallets")
    );

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Wallet[];
};

export const createWallet = async (
    uid: string,
    wallet: Omit<Wallet, "id" | "createdAt">
) => {
    await addDoc(
        collection(db, "users", uid, "wallets"),
        {
            ...wallet,
            createdAt: Date.now()
        }
    );
};

export const updateWallet = async (
    uid: string,
    walletId: string,
    wallet: Partial<Wallet>
) => {
    await updateDoc(
        doc(db, "users", uid, "wallets", walletId),
        wallet
    );
};

export const deleteWallet = async (
    uid: string,
    walletId: string
) => {
    await deleteDoc(
        doc(db, "users", uid, "wallets", walletId)
    );
};

// Transactions CRUD
export const getTransactions = async (uid: string): Promise<Transaction[]> => {
    if (!uid) return [];

    const snapshot = await getDocs(
        collection(db, "users", uid, "transactions")
    );

    const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Transaction[];

    return list.sort((a, b) => b.date - a.date);
};

export const createTransaction = async (
    uid: string,
    transaction: Omit<Transaction, "id" | "createdAt">
) => {
    const tx = {
        ...transaction,
        createdAt: Date.now()
    };

    const docRef = await addDoc(
        collection(db, "users", uid, "transactions"),
        tx
    );

    // Adjust card balance
    const walletRef = doc(db, "users", uid, "wallets", transaction.walletId);
    const walletSnap = await getDoc(walletRef);
    if (walletSnap.exists()) {
        const walletData = walletSnap.data() as Wallet;
        const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        await updateDoc(walletRef, {
            balance: walletData.balance + delta
        });
    }

    return docRef.id;
};

export const updateTransaction = async (
    uid: string,
    transactionId: string,
    updates: Partial<Omit<Transaction, "id" | "createdAt">>
) => {
    const txRef = doc(db, "users", uid, "transactions", transactionId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return;

    const originalTx = txSnap.data() as Transaction;

    // 1. Revert original transaction card balance
    const origWalletRef = doc(db, "users", uid, "wallets", originalTx.walletId);
    const origWalletSnap = await getDoc(origWalletRef);
    if (origWalletSnap.exists()) {
        const origWalletData = origWalletSnap.data() as Wallet;
        const revertDelta = originalTx.type === 'income' ? -originalTx.amount : originalTx.amount;
        await updateDoc(origWalletRef, {
            balance: origWalletData.balance + revertDelta
        });
    }

    // 2. Apply new transaction details and adjust new card balance
    const nextWalletId = updates.walletId !== undefined ? updates.walletId : originalTx.walletId;
    const nextType = updates.type !== undefined ? updates.type : originalTx.type;
    const nextAmount = updates.amount !== undefined ? updates.amount : originalTx.amount;

    const newWalletRef = doc(db, "users", uid, "wallets", nextWalletId);
    const newWalletSnap = await getDoc(newWalletRef);
    if (newWalletSnap.exists()) {
        const newWalletData = newWalletSnap.data() as Wallet;
        const newDelta = nextType === 'income' ? nextAmount : -nextAmount;
        await updateDoc(newWalletRef, {
            balance: newWalletData.balance + newDelta
        });
    }

    // 3. Update transaction doc
    await updateDoc(txRef, updates);
};

export const deleteTransaction = async (
    uid: string,
    transactionId: string
) => {
    const txRef = doc(db, "users", uid, "transactions", transactionId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return;

    const originalTx = txSnap.data() as Transaction;

    // Revert balance impact
    const walletRef = doc(db, "users", uid, "wallets", originalTx.walletId);
    const walletSnap = await getDoc(walletRef);
    if (walletSnap.exists()) {
        const walletData = walletSnap.data() as Wallet;
        const revertDelta = originalTx.type === 'income' ? -originalTx.amount : originalTx.amount;
        await updateDoc(walletRef, {
            balance: walletData.balance + revertDelta
        });
    }

    // Delete transaction
    await deleteDoc(txRef);
};

// Goals CRUD
export const getGoals = async (uid: string): Promise<Goal[]> => {
    if (!uid) return [];

    const snapshot = await getDocs(
        collection(db, "users", uid, "goals")
    );

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Goal[];
};

export const createGoal = async (
    uid: string,
    goal: Omit<Goal, "id" | "createdAt" | "status">
) => {
    const status = goal.currentAmount >= goal.targetAmount ? 'completed' : 'active';
    await addDoc(
        collection(db, "users", uid, "goals"),
        {
            ...goal,
            status,
            createdAt: Date.now()
        }
    );
};

export const updateGoal = async (
    uid: string,
    goalId: string,
    updates: Partial<Omit<Goal, "id" | "createdAt">>
) => {
    const goalRef = doc(db, "users", uid, "goals", goalId);
    const goalSnap = await getDoc(goalRef);
    if (!goalSnap.exists()) return;

    const currentGoal = goalSnap.data() as Goal;
    const merged = { ...currentGoal, ...updates };
    const status = merged.currentAmount >= merged.targetAmount ? 'completed' : 'active';

    await updateDoc(goalRef, {
        ...updates,
        status
    });
};

export const deleteGoal = async (
    uid: string,
    goalId: string
) => {
    await deleteDoc(
        doc(db, "users", uid, "goals", goalId)
    );
};

export const contributeToGoal = async (
    uid: string,
    goalId: string,
    amount: number
) => {
    const wallets = await getWallets(uid);
    const primaryWallet = wallets.find(w => w.id === 'card-1') || wallets[0];
    if (!primaryWallet) return;

    const walletRef = doc(db, "users", uid, "wallets", primaryWallet.id);
    await updateDoc(walletRef, {
        balance: Math.max(0, primaryWallet.balance - amount)
    });

    const goalRef = doc(db, "users", uid, "goals", goalId);
    const goalSnap = await getDoc(goalRef);
    if (goalSnap.exists()) {
        const goalData = goalSnap.data() as Goal;
        const nextAmount = goalData.currentAmount + amount;
        const status = nextAmount >= goalData.targetAmount ? 'completed' : 'active';
        await updateDoc(goalRef, {
            currentAmount: nextAmount,
            status
        });

        const newTx = {
            type: 'expense' as const,
            amount,
            category: 'Shopping',
            walletId: primaryWallet.id,
            recipientName: `Savings Goal: ${goalData.name}`,
            status: 'completed' as const,
            date: Date.now(),
            notes: `Dedicated savings contribution to ${goalData.name}`,
            createdAt: Date.now()
        };

        await addDoc(
            collection(db, "users", uid, "transactions"),
            newTx
        );
    }
};

// Budgets CRUD
export const getBudgets = async (uid: string): Promise<Budget[]> => {
    if (!uid) return [];

    const snapshot = await getDocs(
        collection(db, "users", uid, "budgets")
    );

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Budget[];
};

export const createBudget = async (
    uid: string,
    budget: Omit<Budget, "id" | "spent" | "remaining">
) => {
    await addDoc(
        collection(db, "users", uid, "budgets"),
        {
            ...budget,
            spent: 0,
            remaining: budget.monthlyLimit
        }
    );
};

export const updateBudget = async (
    uid: string,
    budgetId: string,
    updates: Partial<Omit<Budget, "id" | "spent" | "remaining">>
) => {
    const budgetRef = doc(db, "users", uid, "budgets", budgetId);
    await updateDoc(budgetRef, updates);
};

export const deleteBudget = async (
    uid: string,
    budgetId: string
) => {
    await deleteDoc(
        doc(db, "users", uid, "budgets", budgetId)
    );
};

export const updateDisplayName = async (
    uid: string,
    displayName: string
) => {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
        displayName,
    });
};

export const updateCurrency = async (
    uid: string,
    currency: string
) => {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
        currency,
    });
};

export const updateNotificationSettings = async (
    uid: string,
    notifications: {
        budgetAlerts: boolean;
        goalAlerts: boolean;
        monthlySummary: boolean;
        transactionAlerts: boolean;
    }
) => {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
        budgetAlerts: notifications.budgetAlerts,
        goalAlerts: notifications.goalAlerts,
        monthlySummary: notifications.monthlySummary,
        transactionAlerts: notifications.transactionAlerts,
    });
};

export const updateUserProfile = async (
    uid: string,
    updates: {
        displayName?: string;
        currency?: string;
        budgetAlerts?: boolean;
        goalAlerts?: boolean;
        monthlySummary?: boolean;
        transactionAlerts?: boolean;
    }
) => {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, updates);
};