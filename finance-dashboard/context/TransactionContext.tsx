"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useWallets } from "./WalletContext";
import { Transaction } from "@/types";
import {
    getTransactionsApi,
    createTransactionApi,
    updateTransactionApi,
    deleteTransactionApi,
} from "@/lib/api/transaction";

interface TransactionContextType {
    transactions: Transaction[];
    loading: boolean;
    refreshTransactions: () => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
    editTransaction: (
        id: string,
        updates: Partial<Omit<Transaction, "id" | "createdAt">>
    ) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType>(
    {} as TransactionContextType
);

export function TransactionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { refreshWallets } = useWallets();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTransactions = async () => {
        if (!user) return;
        const data = await getTransactionsApi();
        setTransactions(data);
    };

    useEffect(() => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        refreshTransactions().finally(() => setLoading(false));
    }, [user]);

    const addTransaction = async (
        transaction: Omit<Transaction, "id" | "createdAt">
    ) => {
        if (!user) return;
        await createTransactionApi(transaction);
        await Promise.all([refreshTransactions(), refreshWallets()]);
    };

    const editTransaction = async (
        id: string,
        updates: Partial<Omit<Transaction, "id" | "createdAt">>
    ) => {
        if (!user) return;
        await updateTransactionApi(id, updates);
        await Promise.all([refreshTransactions(), refreshWallets()]);
    };

    const deleteTransaction = async (id: string) => {
        if (!user) return;
        await deleteTransactionApi(id);
        await Promise.all([refreshTransactions(), refreshWallets()]);
    };

    return (
        <TransactionContext.Provider
            value={{
                transactions,
                loading,
                refreshTransactions,
                addTransaction,
                editTransaction,
                deleteTransaction,
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
}

export const useTransactions = () => useContext(TransactionContext);
