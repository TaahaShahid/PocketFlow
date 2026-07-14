"use client";

import { useEffect, useState } from "react";
import ClientLayout from "@/components/shared/ClientLayout";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render anything until the browser has mounted
    if (!mounted) {
        return null;
    }

    return (
        <AuthGuard>
            <ClientLayout>
                {children}
            </ClientLayout>
        </AuthGuard>
    );
}