"use client";

import { useState, useEffect, useMemo } from "react";
import {
    User,
    DollarSign,
    Save,
    Loader2,
    Pencil,
    Lock,
    Mail,
    Calendar,
    Bell,
    Shield,
    FolderDown,
    Download,
    AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFinanceStore } from "../../../hooks/useFinanceStore";
import { sendPasswordResetEmail } from "firebase/auth";
// NOTE: adjust this import path to wherever your initialized Firebase `auth`
// instance is exported from (e.g. your firebase config/init file).
import { auth } from "@/lib/firebase";
import { useWallets } from "@/context/WalletContext";
import { useTransactions } from "@/context/TransactionContext";
import { useGoals } from "@/context/GoalContext";

const CURRENCIES = [
    { code: "USD", label: "USD — US Dollar" },
    { code: "EUR", label: "EUR — Euro" },
    { code: "GBP", label: "GBP — British Pound" },
    { code: "PKR", label: "PKR — Pakistani Rupee" },
    { code: "INR", label: "INR — Indian Rupee" },
    { code: "AED", label: "AED — UAE Dirham" },
    { code: "CAD", label: "CAD — Canadian Dollar" },
    { code: "AUD", label: "AUD — Australian Dollar" },
];

// Shared card treatment matching the rest of the app (see .glass-card in globals.css)
const cardBase = "glass-card rounded-2xl";

function getInitials(name: string) {
    if (!name.trim()) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toCsv(headers: string[], rows: (string | number)[][]) {
    return [headers, ...rows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
        .join("\n");
}

function downloadCsv(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function SettingsPage() {
    const { profile, saveProfile } = useAuth();
    const { wallets } = useWallets();
    const { transactions } = useTransactions();
    const { goals } = useGoals();

    const [displayName, setDisplayName] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [saving, setSaving] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);

    // Notification toggles — these map directly to the real Firestore fields
    // already supported by saveProfile(): budgetAlerts, goalAlerts, monthlySummary, transactionAlerts
    const [budgetAlerts, setBudgetAlerts] = useState(false);
    const [goalAlerts, setGoalAlerts] = useState(false);
    const [monthlySummary, setMonthlySummary] = useState(false);
    const [transactionAlerts, setTransactionAlerts] = useState(false);

    // Danger zone confirmation
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    useEffect(() => {
        if (!profile) return;

        setDisplayName(profile.displayName);
        setCurrency(profile.currency);
        setBudgetAlerts(Boolean(profile.budgetAlerts));
        setGoalAlerts(Boolean(profile.goalAlerts));
        setMonthlySummary(Boolean(profile.monthlySummary));
        setTransactionAlerts(Boolean(profile.transactionAlerts));
    }, [profile]);

    const handleSave = async () => {
        try {
            setSaving(true);

            await saveProfile({
                displayName,
                currency,
                budgetAlerts,
                goalAlerts,
                monthlySummary,
                transactionAlerts,
            });

            setIsEditingName(false);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    // Real numbers for the Currency Preview, reusing the same "this month" window
    // as the Dashboard's metrics calculation.
    const preview = useMemo(() => {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        let income = 0;
        let expense = 0;
        transactions.forEach((t) => {
            if (t.status !== "completed" || t.date < firstOfMonth) return;
            if (t.type === "income") income += t.amount;
            else expense += t.amount;
        });

        return {
            walletBalance: wallets.reduce((sum, c) => sum + c.balance, 0),
            monthlyIncome: income,
            monthlyExpense: expense,
        };
    }, [wallets, transactions]);

    const formatCurrency = (val: number) => {
        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                minimumFractionDigits: 0,
            }).format(val);
        } catch {
            // Falls back gracefully if `currency` isn't a valid ISO code yet (e.g. mid-selection)
            return `$${val.toFixed(0)}`;
        }
    };

    // NOTE: assumes `profile` has `email` and `createdAt` fields — adjust the
    // property names below if your actual Profile type names them differently.
    const profileEmail = (profile as any)?.email ?? "";
    const memberSince = (profile as any)?.createdAt
        ? new Date((profile as any).createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
        : "—";

    // --- Real exports, reusing the same CSV technique as the Transactions/Reports pages ---
    const handleExportTransactions = () => {
        if (transactions.length === 0) {
            alert("No transactions to export.");
            return;
        }
        const csv = toCsv(
            ["Date", "Type", "Recipient", "Category", "Amount", "Status", "Notes"],
            transactions.map((t) => [
                new Date(t.date).toISOString().split("T")[0],
                t.type,
                t.recipientName,
                t.category,
                t.amount.toFixed(2),
                t.status,
                t.notes || "",
            ])
        );
        downloadCsv(`pocketflow-transactions-${new Date().toISOString().split("T")[0]}.csv`, csv);
    };

    const handleExportWallets = () => {
        if (wallets.length === 0) {
            alert("No wallets to export.");
            return;
        }
        const csv = toCsv(
            ["Nickname", "Card Number", "Balance"],
            wallets.map((c) => [c.nickname || "Unnamed Card", c.cardNumber, c.balance.toFixed(2)])
        );
        downloadCsv(`pocketflow-wallets-${new Date().toISOString().split("T")[0]}.csv`, csv);
    };

    const handleExportGoals = () => {
        if (goals.length === 0) {
            alert("No goals to export.");
            return;
        }
        const csv = toCsv(
            ["Name", "Target Amount", "Current Amount", "Deadline", "Status"],
            goals.map((g) => [
                g.name,
                g.targetAmount.toFixed(2),
                g.currentAmount.toFixed(2),
                new Date(g.deadline).toISOString().split("T")[0],
                g.status,
            ])
        );
        downloadCsv(`pocketflow-goals-${new Date().toISOString().split("T")[0]}.csv`, csv);
    };

    // --- Real: sends an actual Firebase password reset email ---
    const handlePasswordReset = async () => {
        if (!profileEmail) {
            alert("No email on file for this account.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, profileEmail);
            alert(`Password reset email sent to ${profileEmail}.`);
        } catch (err) {
            console.error(err);
            alert("Failed to send password reset email.");
        }
    };

    // --- Intentionally deferred per your own rollout plan: these need extra
    // safeguards (cascading Firestore deletes, Auth account deletion, redirect
    // flow) that shouldn't ship until built and tested properly. ---
    const handleResetDemoData = () => {
        // TODO: replace with your store's real reset method, e.g. `resetDemoData()`
        alert("Demo data reset isn't wired up yet — tell me the real function name and I'll connect it.");
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmText !== "DELETE") return;
        // TODO: this needs its own confirmation modal + cascading Firestore
        // document/subcollection deletion + Firebase Auth account deletion +
        // redirect to the landing page, per your rollout plan.
        alert("Account deletion isn't wired up yet — this is intentionally being built last.");
    };

    return (
        <div className="space-y-6">

            {/* Header Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-on-surface">Settings</h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                        Manage your account preferences and application settings.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !profile}
                    className="flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-on-primary bg-pf-primary rounded-xl hover:bg-pf-primary-container transition-all shadow-md shadow-pf-primary/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-pf-primary self-start sm:self-auto"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save className="h-4.5 w-4.5" />
                            <span>Save</span>
                        </>
                    )}
                </button>
            </div>

            {!profile ? (
                <div className={`${cardBase} p-10 flex items-center justify-center gap-2 text-sm text-on-surface-variant`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading profile...</span>
                </div>
            ) : (
                <>
                    {/* Account Information */}
                    <div className={`${cardBase} p-6 shadow-sm`}>
                        <div className="flex items-center justify-between pb-5 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-pf-primary/10 rounded-xl text-pf-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-bold text-on-surface">Account Information</h3>
                            </div>
                            <button
                                onClick={() => setIsEditingName((v) => !v)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pf-primary hover:bg-pf-primary/10 rounded-lg transition-colors"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>{isEditingName ? "Cancel" : "Edit"}</span>
                            </button>
                        </div>

                        <div className="pt-6 space-y-5">
                            {/* Avatar */}
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-pf-primary/20 flex items-center justify-center text-pf-primary font-bold text-2xl">
                                    {getInitials(displayName)}
                                </div>
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                                    Display Name
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                                        <User className="h-4.5 w-4.5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={displayName}
                                        disabled={!isEditingName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full h-11 pl-11 pr-11 border border-white/10 rounded-xl text-sm bg-slate-900 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-pf-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <span className="absolute inset-y-0 right-3.5 flex items-center text-on-surface-variant">
                                        <Pencil className="h-4 w-4" />
                                    </span>
                                </div>
                            </div>

                            {/* Email (Read Only) */}
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                                    Email (Read Only)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                                        <Mail className="h-4.5 w-4.5" />
                                    </span>
                                    <input
                                        type="email"
                                        value={profileEmail}
                                        disabled
                                        className="w-full h-11 pl-11 pr-11 border border-white/10 rounded-xl text-sm bg-slate-900 text-on-surface-variant opacity-70 cursor-not-allowed"
                                    />
                                    <span className="absolute inset-y-0 right-3.5 flex items-center text-on-surface-variant">
                                        <Lock className="h-4 w-4" />
                                    </span>
                                </div>
                            </div>

                            {/* Member Since */}
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-on-surface-variant" />
                                <span className="text-on-surface-variant">Member Since</span>
                                <span className="font-semibold text-on-surface">{memberSince}</span>
                            </div>
                        </div>
                    </div>

                    {/* Currency Preferences */}
                    <div className={`${cardBase} p-6 shadow-sm`}>
                        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
                            <div className="p-2.5 bg-pf-primary/10 rounded-xl text-pf-primary">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-on-surface">Currency Preferences</h3>
                        </div>

                        <div className="pt-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                                    Preferred Currency
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full h-11 px-3.5 border border-white/10 rounded-xl text-sm bg-slate-900 text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary focus:border-transparent cursor-pointer"
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c.code} value={c.code} className="bg-slate-900">
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Real preview using actual wallet/transaction data */}
                            <div>
                                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Preview</p>
                                <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/10">
                                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                                        <span className="text-on-surface-variant">Wallet Balance</span>
                                        <span className="font-bold text-on-surface">{formatCurrency(preview.walletBalance)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                                        <span className="text-on-surface-variant">Monthly Income</span>
                                        <span className="font-bold text-green-400">{formatCurrency(preview.monthlyIncome)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                                        <span className="text-on-surface-variant">Monthly Expense</span>
                                        <span className="font-bold text-error">{formatCurrency(preview.monthlyExpense)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className={`${cardBase} p-6 shadow-sm`}>
                        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
                            <div className="p-2.5 bg-pf-primary/10 rounded-xl text-pf-primary">
                                <Bell className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-on-surface">Notifications</h3>
                        </div>
                        <p className="text-xs text-on-surface-variant pt-4">
                            Changes here are saved together with your profile — click <span className="font-semibold text-on-surface">Save</span> above to apply them.
                        </p>

                        <div className="pt-4 divide-y divide-white/10">
                            {[
                                { label: "Budget Alerts", desc: "Notify when a budget limit is nearly reached", value: budgetAlerts, set: setBudgetAlerts },
                                { label: "Goal Completion Alerts", desc: "Notify when a savings goal is achieved", value: goalAlerts, set: setGoalAlerts },
                                { label: "Monthly Summary", desc: "Receive a monthly financial report", value: monthlySummary, set: setMonthlySummary },
                                { label: "Transaction Alerts", desc: "Notify when a transaction is added", value: transactionAlerts, set: setTransactionAlerts },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                    <div>
                                        <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                                    </div>
                                    <button
                                        role="switch"
                                        aria-checked={item.value}
                                        onClick={() => item.set((v) => !v)}
                                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${item.value ? "bg-pf-primary" : "bg-white/10"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security */}
                    <div className={`${cardBase} p-6 shadow-sm`}>
                        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
                            <div className="p-2.5 bg-pf-primary/10 rounded-xl text-pf-primary">
                                <Shield className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-on-surface">Security</h3>
                        </div>

                        <div className="pt-6 space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Current Email</p>
                                <p className="text-sm font-semibold text-on-surface">{profileEmail || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Password</p>
                                <p className="text-sm font-semibold text-on-surface tracking-widest">••••••••••••</p>
                            </div>
                            <button
                                onClick={handlePasswordReset}
                                className="px-4 py-2.5 text-sm font-semibold text-on-surface bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                            >
                                Send Password Reset Email
                            </button>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className={`${cardBase} p-6 shadow-sm`}>
                        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
                            <div className="p-2.5 bg-pf-primary/10 rounded-xl text-pf-primary">
                                <FolderDown className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-on-surface">Data Management</h3>
                        </div>

                        <div className="pt-6 flex flex-wrap gap-3">
                            <button
                                onClick={handleExportTransactions}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Export Transactions</span>
                            </button>
                            <button
                                onClick={handleExportWallets}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Export Wallets</span>
                            </button>
                            <button
                                onClick={handleExportGoals}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Export Goals</span>
                            </button>
                            <button
                                onClick={handleResetDemoData}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-tertiary bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/20 rounded-xl transition-colors"
                            >
                                <span>Reset Demo Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="glass-card rounded-2xl p-6 shadow-sm border border-error/20">
                        <div className="flex items-center gap-3 pb-5 border-b border-error/20">
                            <div className="p-2.5 bg-error/10 rounded-xl text-error">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-error">Danger Zone</h3>
                        </div>

                        <div className="pt-6 space-y-4">
                            <p className="text-sm text-on-surface-variant">
                                Delete your PocketFlow account permanently. This action cannot be undone.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                                    Type DELETE to continue
                                </label>
                                <input
                                    type="text"
                                    placeholder="DELETE"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full h-11 px-3.5 border border-error/30 rounded-xl text-sm bg-slate-900 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== "DELETE"}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-error rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}