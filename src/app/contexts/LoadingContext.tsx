'use client';

import React, { createContext, useContext, useState } from 'react';
import LoadingModal from '../components/LoadingModal'

interface LoadingContextType {
    isLoading: boolean;
    message: string;
    startLoading: (msg: string) => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const startLoading = (msg: string) => {
        setMessage(msg);
        setIsLoading(true);
    };

    const stopLoading = () => {
        setMessage("");
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, message, startLoading, stopLoading }}>
            {children}
            <LoadingModal isOpen={isLoading} message={message} />
        </LoadingContext.Provider>
    );
};
