"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,

    updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { initializeUser, getUserData, updateUserProfile } from "@/lib/firestore";

interface UserProfile {
    displayName: string;
    email: string;
    currency: string;
    theme: string;

    createdAt: Date | null;

    budgetAlerts: boolean;
    goalAlerts: boolean;
    monthlySummary: boolean;
    transactionAlerts: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;

    login: (email: string, password: string) => Promise<void>;
    signup: (
        name: string,
        email: string,
        password: string
    ) => Promise<void>;

    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;

    refreshProfile: () => Promise<void>;

    saveProfile: (
        updates: {
            displayName?: string;
            currency?: string;
            budgetAlerts?: boolean;
            goalAlerts?: boolean;
            monthlySummary?: boolean;
            transactionAlerts?: boolean;
        }
    ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,

    login: async () => { },
    signup: async () => { },

    signInWithGoogle: async () => { },
    logout: async () => { },

    refreshProfile: async () => { },

    saveProfile: async () => { },
});

export const AuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setProfile(null);
            return;
        }

        const data = await getUserData(currentUser.uid);

        if (!data) return;

        setProfile({
            displayName: data.displayName ?? "",
            email: data.email ?? "",
            currency: data.currency ?? "USD",
            theme: data.theme ?? "dark",

            createdAt: data.createdAt?.toDate?.() ?? null,

            budgetAlerts: data.budgetAlerts ?? true,
            goalAlerts: data.goalAlerts ?? true,
            monthlySummary: data.monthlySummary ?? true,
            transactionAlerts: data.transactionAlerts ?? true,
        });
    };


    const saveProfile = async (
        updates: {
            displayName?: string;
            currency?: string;
            budgetAlerts?: boolean;
            goalAlerts?: boolean;
            monthlySummary?: boolean;
            transactionAlerts?: boolean;
        }
    ) => {
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        if (updates.displayName) {
            await updateFirebaseProfile(currentUser, {
                displayName: updates.displayName,
            });
        }

        await updateUserProfile(currentUser.uid, updates);

        await refreshProfile();
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                setUser(user);

                if (user) {
                    await initializeUser(
                        user.uid,
                        user.email,
                        user.displayName
                    );

                    await refreshProfile();

                    // const data = await getUserData(user.uid);

                    // if (data) {
                    //     setProfile({
                    //         displayName: data.displayName ?? "",
                    //         email: data.email ?? "",
                    //         currency: data.currency ?? "USD",
                    //         theme: data.theme ?? "dark",
                    //     });
                    // }
                } else {
                    setProfile(null);
                }
            } catch (error) {
                console.error("Auth initialization failed:", error);
            } finally {
                setLoading(false);
            }

        });

        return () => unsubscribe();
    }, []);

    // Email Sign Up
    const signup = async (
        name: string,
        email: string,
        password: string
    ) => {
        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        if (name.trim()) {
            await updateFirebaseProfile(credential.user, {
                displayName: name,
            });
        }
    };

    // Email Login
    const login = async (
        email: string,
        password: string
    ) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    // Google Login
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    // Logout
    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,

                login,
                signup,

                signInWithGoogle,
                logout,

                refreshProfile,
                saveProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);