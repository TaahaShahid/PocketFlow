"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Wallet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
            <div className="min-h-screen flex items-center justify-center bg-jm-navy">
                <Loader2 className="w-8 h-8 animate-spin text-jm-light-blue" />
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
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            setIsSubmitting(true);

            await signInWithGoogle();

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <PublicRoute>
            <div className="fixed inset-0 z-[100] bg-gradient-to-br from-jm-navy via-slate-950 to-black flex items-center justify-center p-6">

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8"
                    style={{
                        width: "450px",
                        maxWidth: "95vw",
                        maxHeight: "90vh",
                    }}>

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">

                        <div className="w-16 h-16 rounded-2xl bg-jm-dark-blue flex items-center justify-center shadow-lg">
                            <Wallet className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-3xl font-bold text-white mt-5">
                            Create Account
                        </h1>

                        <p className="text-slate-400 mt-2 text-center">
                            Start managing your finances with PocketFlow.
                        </p>

                    </div>

                    <div className="space-y-5">

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Full Name
                            </label>

                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-12 rounded-xl border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-jm-light-blue"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 rounded-xl border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-jm-light-blue"
                            />
                        </div>

                        {/* Password */}
                        <div>

                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>

                            <div className="relative">

                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-white/10 bg-slate-900 px-4 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-jm-light-blue"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>

                            </div>

                        </div>

                        {/* Confirm Password */}
                        <div>

                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm Password
                            </label>

                            <div className="relative">

                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-white/10 bg-slate-900 px-4 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-jm-light-blue"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>

                            </div>

                        </div>

                        {/* Create Account */}
                        <button
                            type="button"
                            onClick={handleSignup}
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-xl bg-jm-dark-blue hover:bg-jm-light-blue transition font-semibold text-white disabled:opacity-60"
                        >
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3">

                            <div className="flex-1 h-px bg-white/10" />

                            <span className="text-xs uppercase tracking-widest text-slate-500">
                                OR
                            </span>

                            <div className="flex-1 h-px bg-white/10" />

                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 transition text-white font-medium flex items-center justify-center gap-3 disabled:opacity-60"
                        >
                            <img
                                src="https://www.google.com/favicon.ico"
                                alt="Google"
                                className="w-5 h-5"
                            />

                            Continue with Google
                        </button>

                    </div>
                    {error && (
                        <p className="text-red-400 text-sm text-center">
                            {error}
                        </p>
                    )}
                    {/* Footer */}
                    <p className="text-center text-sm text-slate-400 mt-8">

                        Already have an account?{" "}

                        <Link
                            href="/login"
                            className="text-jm-light-blue hover:underline font-semibold"
                        >
                            Sign In
                        </Link>

                    </p>

                </div>

            </div>
        </PublicRoute>
    );
}