'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, onAuthStateChanged, User } from '../../../firebase-config';
import { db } from '../../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    checkTripPermission: (tripId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPages = ['/sharing'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            if (!user && !publicPages.some(page => pathname.startsWith(page))) {
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);

    const checkTripPermission = async (tripId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const tripDoc = await getDoc(doc(db, "trips", tripId));
            if (tripDoc.exists() && tripDoc.data().userId === user.uid) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error("Error checking trip permission:", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, checkTripPermission }}>
        {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};