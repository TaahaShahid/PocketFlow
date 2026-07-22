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
import {
    getBudgetsApi,
    createBudgetApi,
    updateBudgetApi,
    deleteBudgetApi,
} from "@/lib/api/budget";

interface BudgetContextType {
    budgets: Budget[];
    loading: boolean;

    refreshBudgets: () => Promise<void>;

    addBudget: (
        budget: Omit<Budget, "id" | "spent" | "remaining">
    ) => Promise<void>;

    editBudget: (
        id: string,
        budget: Partial<Budget>
    ) => Promise<void>;

    removeBudget: (
        id: string
    ) => Promise<void>;
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
        const data = await getBudgetsApi();
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

    const addBudget = async (
        budget: Omit<Budget, "id" | "spent" | "remaining">
    ) => {
        if (!user) return;

        await createBudgetApi(budget);

        await refreshBudgets();
    };

    const editBudget = async (
        id: string,
        budget: Partial<Budget>
    ) => {
        if (!user) return;

        await updateBudgetApi(id, budget);

        await refreshBudgets();
    };

    const removeBudget = async (
        id: string
    ) => {
        if (!user) return;

        await deleteBudgetApi(id);

        await refreshBudgets();
    };

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
                addBudget,
                editBudget,
                removeBudget,
            }}
        >
            {children}
        </BudgetContext.Provider>
    );
}

export const useBudgets = () => useContext(BudgetContext);
