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
    updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { initializeUser, getUserData } from "@/lib/firestore";

interface UserProfile {
    displayName: string;
    email: string;
    currency: string;
    theme: string;
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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,

    login: async () => { },
    signup: async () => { },

    signInWithGoogle: async () => { },
    logout: async () => { },
});

export const AuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);




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

                    const data = await getUserData(user.uid);

                    if (data) {
                        setProfile({
                            displayName: data.displayName ?? "",
                            email: data.email ?? "",
                            currency: data.currency ?? "USD",
                            theme: data.theme ?? "dark",
                        });
                    }
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
            await updateProfile(credential.user, {
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);