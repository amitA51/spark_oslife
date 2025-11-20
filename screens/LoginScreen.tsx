import React, { useState } from 'react';
import { signIn, signInWithGoogle } from '../services/authService';
import { GoogleIcon, LockIcon, UserIcon } from '../components/icons';

interface LoginScreenProps {
    onNavigateToSignup: () => void;
    onSkip: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignup, onSkip }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
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
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
                        <span className="text-3xl">⚡</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        ברוך הבא ל-Spark OS
                    </h1>
                    <p className="text-white/60 text-sm">
                        התחבר כדי לסנכרן את המידע שלך בכל המכשירים
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl mb-6 text-sm text-center backdrop-blur-sm animate-fade-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
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
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-white text-[var(--dynamic-accent-start)] font-bold hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'מתחבר...' : 'התחבר'}
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
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <GoogleIcon className="w-5 h-5" />
                    התחבר עם Google
                </button>

                <div className="text-center space-y-4">
                    <p className="text-white/60 text-sm">
                        אין לך חשבון?{' '}
                        <button
                            onClick={onNavigateToSignup}
                            className="text-white font-semibold hover:underline focus:outline-none"
                        >
                            הירשם עכשיו
                        </button>
                    </p>
                    <button
                        onClick={onSkip}
                        className="text-white/40 text-xs hover:text-white/60 transition-colors focus:outline-none"
                    >
                        המשך במצב לא מקוון (ללא סנכרון)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
