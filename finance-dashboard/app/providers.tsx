"use client";

import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { GoalProvider } from "@/context/GoalContext";
import { BudgetProvider } from "@/context/BudgetContext";
import { NotificationProvider } from "@/context/NotificationContext";

export function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NotificationProvider>
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
        </NotificationProvider>
    );
}