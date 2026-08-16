"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Wallet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import PublicRoute from "@/components/auth/PublicRoute";

export default function LoginPage() {
    const router = useRouter();
    const { user, loading, login, signInWithGoogle } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!loading && user) {
            router.replace("/dashboard");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050814]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleLogin = async () => {
        setError("");

        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        try {
            setIsSubmitting(true);
            await login(email, password);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsSubmitting(true);
            await signInWithGoogle();
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PublicRoute>
            <div className="fixed inset-0 z-[100] bg-[#050814] flex items-center justify-center p-6 antialiased">
                {/* Visual Ambient Glows */}
                <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

                <div 
                    className="bg-card/45 backdrop-blur-2xl border border-border rounded-3xl shadow-2xl p-8 z-10 w-full max-w-md"
                    style={{ maxHeight: "90vh", overflowY: "auto" }}
                >
                    {/* Logo Header */}
                    <div className="flex flex-col items-center mb-8 text-center">
                        <img
                            src="/B_LOGO.jpg"
                            alt="PocketFlow Logo"
                            className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-primary/15"
                        />
                        <h1 className="text-2xl font-bold text-foreground mt-5 tracking-tight">
                            Welcome back
                        </h1>
                        <p className="text-muted-foreground mt-1.5 text-sm font-semibold">
                            Securely manage your finances anywhere.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all text-sm font-semibold"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all text-sm font-semibold"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <Button
                            type="button"
                            onClick={handleLogin}
                            disabled={isSubmitting}
                            className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/10 mt-6"
                        >
                            {isSubmitting ? "Signing In..." : "Sign In"}
                        </Button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                OR
                            </span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Google Login */}
                        <Button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isSubmitting}
                            variant="outline"
                            className="w-full h-11 rounded-xl border-border bg-muted/10 hover:bg-muted/20 text-foreground font-semibold flex items-center justify-center gap-2.5"
                        >
                            <img
                                src="https://www.google.com/favicon.ico"
                                alt="GoogleLogo"
                                className="w-4 h-4 shrink-0"
                            />
                            Continue with Google
                        </Button>
                    </div>

                    {error && (
                        <p className="text-rose-500 text-xs font-semibold text-center mt-4">
                            {error}
                        </p>
                    )}

                    {/* Footer Redirect */}
                    <p className="text-center text-sm text-muted-foreground mt-8 font-semibold">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="text-primary hover:underline font-bold"
                        >
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </PublicRoute>
    );
}