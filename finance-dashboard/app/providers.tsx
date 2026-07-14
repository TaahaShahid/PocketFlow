"use client";

import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { GoalProvider } from "@/context/GoalContext";
import { BudgetProvider } from "@/context/BudgetContext";

export function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <WalletProvider>
                <TransactionProvider>
                    <GoalProvider>
                        <BudgetProvider>
                            {children}
                        </BudgetProvider>
                    </GoalProvider>
                </TransactionProvider>
            </WalletProvider>
        </AuthProvider>
    );
}