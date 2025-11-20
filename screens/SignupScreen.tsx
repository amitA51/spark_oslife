import React, { useState } from 'react';
import { signUp, signInWithGoogle } from '../services/authService';
import { GoogleIcon, LockIcon, UserIcon } from '../components/icons';

interface SignupScreenProps {
    onNavigateToLogin: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigateToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('הסיסמאות אינן תואמות');
            return;
        }

        if (password.length < 6) {
            setError('הסיסמה חייבת להכיל לפחות 6 תווים');
            return;
        }

        setIsLoading(true);
        try {
            await signUp(email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] p-4">
            <div className="themed-card p-8 max-w-md w-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        צור חשבון חדש
                    </h1>
                    <p className="text-white/60 text-sm">
                        הצטרף ל-Spark OS והתחל לנהל את חייך
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl mb-6 text-sm text-center backdrop-blur-sm animate-fade-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4 mb-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            placeholder="אימייל"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all"
                            required
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors">
                            <LockIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="password"
                            placeholder="סיסמה"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all"
                            required
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors">
                            <LockIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="password"
                            placeholder="אימות סיסמה"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-white text-[var(--dynamic-accent-start)] font-bold hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'יוצר חשבון...' : 'הרשמה'}
                    </button>
                </form>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 text-white/40 bg-transparent backdrop-blur-xl">או</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleSignup}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <GoogleIcon className="w-5 h-5" />
                    הרשמה עם Google
                </button>

                <div className="text-center">
                    <p className="text-white/60 text-sm">
                        כבר יש לך חשבון?{' '}
                        <button
                            onClick={onNavigateToLogin}
                            className="text-white font-semibold hover:underline focus:outline-none"
                        >
                            התחבר כאן
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupScreen;
