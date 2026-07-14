"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useTransactions } from "./TransactionContext";
import { Budget } from "@/types";
import { getBudgets } from "@/lib/firestore";

interface BudgetContextType {
    budgets: Budget[];
    loading: boolean;
    refreshBudgets: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType>(
    {} as BudgetContextType
);

export function BudgetProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { transactions } = useTransactions();

    const [rawBudgets, setRawBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshBudgets = async () => {
        if (!user) return;
        const data = await getBudgets(user.uid);
        setRawBudgets(data);
    };

    useEffect(() => {
        if (!user) {
            setRawBudgets([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        refreshBudgets().finally(() => setLoading(false));
    }, [user]);

    // Compute budgets spent and remaining client-side
    const budgets = useMemo(() => {
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);
        const startTimestamp = currentMonthStart.getTime();

        const spendingMap: Record<string, number> = {};

        transactions.forEach((tx) => {
            if (
                tx.type === "expense" &&
                tx.date >= startTimestamp &&
                tx.status === "completed"
            ) {
                const cat = tx.category;
                spendingMap[cat] = (spendingMap[cat] || 0) + tx.amount;
            }
        });

        return rawBudgets.map((b) => {
            const spent = spendingMap[b.category] || 0;
            return {
                ...b,
                spent,
                remaining: b.monthlyLimit - spent,
            };
        });
    }, [rawBudgets, transactions]);

    return (
        <BudgetContext.Provider
            value={{
                budgets,
                loading,
                refreshBudgets,
            }}
        >
            {children}
        </BudgetContext.Provider>
    );
}

export const useBudgets = () => useContext(BudgetContext);
