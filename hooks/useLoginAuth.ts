/**
 * useLoginAuth - Centralized auth logic for Login/Signup screens
 * 
 * Handles:
 * - Email/password login
 * - Google OAuth login
 * - Google redirect result handling
 * - Loading and error states
 */
import { useState, useEffect, useCallback } from 'react';
import {
    signIn,
    signInWithGoogle,
    checkGoogleRedirectResult
} from '../services/authService';
import { ERRORS } from '../utils/errorMessages';

interface UseLoginAuthReturn {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    error: string;
    isLoading: boolean;
    handleEmailLogin: (e: React.FormEvent) => Promise<void>;
    handleGoogleLogin: () => Promise<void>;
}

export const useLoginAuth = (): UseLoginAuthReturn => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check for Google redirect result on mount
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                setIsLoading(true);
                const user = await checkGoogleRedirectResult();
                if (user) {
                    console.log('Google redirect sign-in successful');
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : ERRORS.AUTH.GOOGLE_FAILED;
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        handleRedirectResult();
    }, []);

    const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : ERRORS.AUTH.GENERIC;
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [email, password]);

    const handleGoogleLogin = useCallback(async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : ERRORS.AUTH.GOOGLE_FAILED;
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        isLoading,
        handleEmailLogin,
        handleGoogleLogin,
    };
};

export default useLoginAuth;
