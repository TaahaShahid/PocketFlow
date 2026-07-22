"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useWallets } from "./WalletContext";
import { useTransactions } from "./TransactionContext";
import { Goal } from "@/types";
import {
    getGoalsApi,
    createGoalApi,
    updateGoalApi,
    deleteGoalApi,
    contributeToGoalApi,
} from "@/lib/api/goal";

interface GoalContextType {
    goals: Goal[];
    loading: boolean;
    refreshGoals: () => Promise<void>;
    addGoal: (goal: Omit<Goal, "id" | "createdAt" | "status">) => Promise<void>;
    editGoal: (
        id: string,
        updates: Partial<Omit<Goal, "id" | "createdAt">>
    ) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    contributeToGoal: (
        goalId: string,

        amount: number
    ) => Promise<void>;
}

const GoalContext = createContext<GoalContextType>(
    {} as GoalContextType
);

export function GoalProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { refreshWallets } = useWallets();
    const { refreshTransactions } = useTransactions();

    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshGoals = async () => {
        if (!user) return;
        const data = await getGoalsApi();
        setGoals(data);
    };

    useEffect(() => {
        if (!user) {
            setGoals([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        refreshGoals().finally(() => setLoading(false));
    }, [user]);

    const addGoal = async (
        goal: Omit<Goal, "id" | "createdAt" | "status">
    ) => {
        if (!user) return;
        await createGoalApi(goal);
        await refreshGoals();
    };

    const editGoal = async (
        id: string,
        updates: Partial<Omit<Goal, "id" | "createdAt">>
    ) => {
        if (!user) return;
        await updateGoalApi(id, updates);
        await refreshGoals();
    };

    const deleteGoal = async (id: string) => {
        if (!user) return;
        await deleteGoalApi(id);
        await refreshGoals();
    };

    const contributeToGoal = async (
        goalId: string,

        amount: number
    ) => {
        if (!user) return;

        await contributeToGoalApi(
            goalId,

            amount
        );

        await Promise.all([
            refreshGoals(),
            refreshWallets(),
            refreshTransactions(),
        ]);
    };

    return (
        <GoalContext.Provider
            value={{
                goals,
                loading,
                refreshGoals,
                addGoal,
                editGoal,
                deleteGoal,
                contributeToGoal,
            }}
        >
            {children}
        </GoalContext.Provider>
    );
}

export const useGoals = () => useContext(GoalContext);
