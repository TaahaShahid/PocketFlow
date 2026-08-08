import ClientLayout from "@/components/shared/ClientLayout";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <ClientLayout>
                {children}
            </ClientLayout>
        </AuthGuard>
    );
}