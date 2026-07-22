import { api } from "./client";
import { Transaction } from "@/types";

export async function getTransactionsApi(): Promise<Transaction[]> {
    const response = await api.get("/transactions");
    return response.data;
}

export async function createTransactionApi(
    transaction: Omit<Transaction, "id" | "createdAt">
) {
    const response = await api.post("/transactions", {
        wallet_id: transaction.walletId,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        recipient_name: transaction.recipientName,
        notes: transaction.notes,
    });

    return response.data;
}

export async function updateTransactionApi(
    id: string,
    transaction: Partial<Transaction>
) {
    const response = await api.put(`/transactions/${id}`, {
        category: transaction.category,
        recipient_name: transaction.recipientName,
        notes: transaction.notes,
    });

    return response.data;
}

export async function deleteTransactionApi(id: string) {
    await api.delete(`/transactions/${id}`);
}