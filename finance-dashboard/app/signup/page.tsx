"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Wallet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import PublicRoute from "@/components/auth/PublicRoute";

export default function SignupPage() {
    const router = useRouter();
    const { user, loading, signup, signInWithGoogle } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const handleSignup = async () => {
        setError("");

        if (!name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (!password) {
            setError("Please enter a password.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setIsSubmitting(true);
            await signup(name, email, password);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignup = async () => {
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
                {/* Ambient Glow Elements */}
                <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

                <div 
                    className="bg-card/45 backdrop-blur-2xl border border-border rounded-3xl shadow-2xl p-8 z-10 w-full max-w-md"
                    style={{ maxHeight: "90vh", overflowY: "auto" }}
                >
                    {/* Header */}
                    <div className="flex flex-col items-center mb-6 text-center">
                        <img
                            src="/B_LOGO.jpg"
                            alt="PocketFlow Logo"
                            className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-primary/15"
                        />
                        <h1 className="text-2xl font-bold text-foreground mt-5 tracking-tight">
                            Create Account
                        </h1>
                        <p className="text-muted-foreground mt-1.5 text-sm font-semibold">
                            Start managing your finances with PocketFlow.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="Jane Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-10 px-3 border border-border bg-muted/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all font-semibold"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="jane@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-10 px-3 border border-border bg-muted/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all font-semibold"
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
                                    placeholder="Choose a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-10 px-3 pr-12 border border-border bg-muted/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all font-semibold"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full h-10 px-3 pr-12 border border-border bg-muted/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all font-semibold"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="button"
                            onClick={handleSignup}
                            disabled={isSubmitting}
                            className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/10 mt-6"
                        >
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                        </Button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                OR
                            </span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Google Signup */}
                        <Button
                            type="button"
                            onClick={handleGoogleSignup}
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
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-primary hover:underline font-bold"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </PublicRoute>
    );
}