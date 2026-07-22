"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { useAuth } from "./AuthContext";
import { Wallet } from "@/types";
import {
    getWalletsApi,
    createWalletApi,
    updateWalletApi,
    deleteWalletApi,
} from "@/lib/api/wallet";

interface WalletContextType {
    wallets: Wallet[];
    loading: boolean;

    refreshWallets: () => Promise<void>;

    addWallet: (wallet: Omit<Wallet, "id" | "createdAt">) => Promise<void>;

    editWallet: (
        id: string,
        wallet: Partial<Wallet>
    ) => Promise<void>;

    removeWallet: (id: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType>(
    {} as WalletContextType
);

export function WalletProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();

    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshWallets = async () => {
        if (!user) return;

        const data = await getWalletsApi();

        setWallets(data);
    };

    useEffect(() => {
        if (!user) {
            setWallets([]);
            setLoading(false);
            return;
        }

        refreshWallets().finally(() => setLoading(false));
    }, [user]);

    const addWallet = async (
        wallet: Omit<Wallet, "id" | "createdAt">
    ) => {
        if (!user) return;

        await createWalletApi(wallet);

        await refreshWallets();
    };

    const editWallet = async (
        id: string,
        wallet: Partial<Wallet>
    ) => {
        if (!user) return;

        await updateWalletApi(id, wallet);

        await refreshWallets();
    };

    const removeWallet = async (id: string) => {
        if (!user) return;

        await deleteWalletApi(id);

        await refreshWallets();
    };

    return (
        <WalletContext.Provider
            value={{
                wallets,
                loading,
                refreshWallets,
                addWallet,
                editWallet,
                removeWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export const useWallets = () => useContext(WalletContext);