"use client";

import {
    createContext,
    useContext,
    useMemo,
    useState,
} from "react";

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    amount?: number;
    type: "success" | "warning" | "info";
    timestamp: number;
}

interface NotificationContextType {
    notifications: NotificationItem[];

    unreadCount: number;

    addNotification: (
        notification: Omit<
            NotificationItem,
            "id" | "timestamp"
        >
    ) => void;

    removeNotification: (id: string) => void;

    clearNotifications: () => void;
}

const NotificationContext =
    createContext<NotificationContextType | null>(
        null
    );

export function NotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [notifications, setNotifications] =
        useState<NotificationItem[]>([]);

    const addNotification = (
        notification: Omit<
            NotificationItem,
            "id" | "timestamp"
        >
    ) => {
        setNotifications((previous) => [
            {
                ...notification,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
            },
            ...previous,
        ]);
    };

    const removeNotification = (
        id: string
    ) => {
        setNotifications((previous) =>
            previous.filter(
                (notification) =>
                    notification.id !== id
            )
        );
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const value = useMemo(
        () => ({
            notifications,

            unreadCount:
                notifications.length,

            addNotification,

            removeNotification,

            clearNotifications,
        }),
        [notifications]
    );

    return (
        <NotificationContext.Provider
            value={value}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context =
        useContext(NotificationContext);

    if (!context) {
        throw new Error(
            "useNotifications must be used inside NotificationProvider"
        );
    }

    return context;
}