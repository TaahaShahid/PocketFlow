import { api } from "./client";
import { Wallet } from "@/types";


export async function getWalletsApi(): Promise<Wallet[]> {
    const response = await api.get("/wallets");
    return response.data;
}

export async function createWalletApi(
    wallet: Omit<Wallet, "id" | "createdAt">
) {
    const response = await api.post("/wallets", wallet);
    return response.data;
}

export async function updateWalletApi(
    id: string,
    wallet: Partial<Wallet>
) {
    const response = await api.put(`/wallets/${id}`, wallet);
    return response.data;
}

export async function deleteWalletApi(id: string) {
    await api.delete(`/wallets/${id}`);
}