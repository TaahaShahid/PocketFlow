import ClientLayout from "@/components/shared/ClientLayout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ClientLayout>{children}</ClientLayout>;
}