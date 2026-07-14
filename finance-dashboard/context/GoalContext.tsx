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
    getGoals,
    createGoal as createGoalFirestore,
    updateGoal as updateGoalFirestore,
    deleteGoal as deleteGoalFirestore,
    contributeToGoal as contributeToGoalFirestore,
} from "@/lib/firestore";

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
    contributeToGoal: (id: string, amount: number) => Promise<void>;
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
        const data = await getGoals(user.uid);
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
        await createGoalFirestore(user.uid, goal);
        await refreshGoals();
    };

    const editGoal = async (
        id: string,
        updates: Partial<Omit<Goal, "id" | "createdAt">>
    ) => {
        if (!user) return;
        await updateGoalFirestore(user.uid, id, updates);
        await refreshGoals();
    };

    const deleteGoal = async (id: string) => {
        if (!user) return;
        await deleteGoalFirestore(user.uid, id);
        await refreshGoals();
    };

    const contributeToGoal = async (id: string, amount: number) => {
        if (!user) return;
        await contributeToGoalFirestore(user.uid, id, amount);
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
