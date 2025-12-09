import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signUp, signInWithGoogle, checkGoogleRedirectResult } from '../services/authService';
import { GoogleIcon, LockIcon, UserIcon, SparklesIcon } from '../components/icons';
import { PremiumButton, PremiumInput } from '../components/premium/PremiumComponents';
import { FloatingParticles } from '../components/auth';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
  onSkip?: () => void;
}


const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigateToLogin, onSkip }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for Google redirect result on mount (for mobile auth flow)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setIsLoading(true);
        const user = await checkGoogleRedirectResult();
        if (user) {
          console.log('Google redirect sign-in successful');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'שגיאה בהתחברות עם Google';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהרשמה';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהתחברות עם Google';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)]">
      {/* Enhanced Dynamic Background */}
      <div className="absolute inset-0 z-0">
        {/* Primary gradient orbs - different positioning from login */}
        <motion.div
          className="absolute top-[-25%] left-[-15%] w-[800px] h-[800px] rounded-full blur-[150px]"
          style={{ background: 'var(--dynamic-accent-end)' }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-25%] right-[-15%] w-[800px] h-[800px] rounded-full blur-[150px]"
          style={{ background: 'var(--dynamic-accent-start)' }}
          animate={{
            scale: [1.15, 1, 1.15],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Central glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
          style={{ background: 'radial-gradient(circle, var(--dynamic-accent-glow), transparent)' }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(var(--dynamic-accent-end) 1px, transparent 1px),
                              linear-gradient(90deg, var(--dynamic-accent-end) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise-pattern opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg mx-4 p-2">
        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-[2.5rem] overflow-hidden"
        >
          {/* Card border gradient */}
          <div
            className="absolute inset-0 rounded-[2.5rem] p-[1px]"
            style={{
              background: 'linear-gradient(135deg, var(--dynamic-accent-end), transparent 50%, var(--dynamic-accent-start))',
            }}
          />

          {/* Card inner content */}
          <div className="relative bg-[var(--bg-primary)]/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 m-[1px]">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Animated Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))`,
                }}
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                />
                <SparklesIcon className="w-10 h-10 text-white drop-shadow-lg" />
              </motion.div>

              {/* Title with gradient */}
              <motion.h1
                className="text-4xl md:text-5xl font-black tracking-tighter font-heading mb-2"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.8) 50%, var(--dynamic-accent-end) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                הצטרף ל-Spark
              </motion.h1>

              <motion.p
                className="text-sm font-medium tracking-wide"
                style={{ color: 'var(--dynamic-accent-start)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: 0.3 }}
              >
                התחל לנהל את החיים שלך ברמה הבאה
              </motion.p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl mb-5 text-sm text-center backdrop-blur-md"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-4 mb-5">
              <PremiumInput
                label="אימייל"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                icon={<UserIcon className="w-5 h-5" />}
              />

              <PremiumInput
                label="סיסמה"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                icon={<LockIcon className="w-5 h-5" />}
              />

              <PremiumInput
                label="אימות סיסמה"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                icon={<LockIcon className="w-5 h-5" />}
              />

              <PremiumButton
                type="submit"
                isLoading={isLoading}
                className="w-full py-4 text-lg font-bold mt-2"
                variant="primary"
              >
                <span className="flex items-center justify-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  צור חשבון
                </span>
              </PremiumButton>
            </form>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full h-[1px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, var(--dynamic-accent-end), transparent)',
                    opacity: 0.3,
                  }}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-4 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full border"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--dynamic-accent-end)',
                    color: 'var(--dynamic-accent-end)',
                    opacity: 0.8,
                  }}
                >
                  או
                </span>
              </div>
            </div>

            {/* Google Signup */}
            <PremiumButton
              onClick={handleGoogleSignup}
              isLoading={isLoading}
              variant="secondary"
              className="w-full py-4 mb-5"
              icon={<GoogleIcon className="w-5 h-5" />}
            >
              הרשמה עם Google
            </PremiumButton>

            {/* Footer links */}
            <div className="text-center space-y-3">
              <p className="text-gray-400 text-sm">
                כבר יש לך חשבון?{' '}
                <button
                  onClick={onNavigateToLogin}
                  className="font-bold transition-all focus:outline-none ml-1 underline decoration-transparent hover:decoration-current underline-offset-4"
                  style={{ color: 'var(--dynamic-accent-start)' }}
                >
                  התחבר כאן
                </button>
              </p>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="text-gray-500 text-xs hover:text-white transition-colors focus:outline-none tracking-wide opacity-60 hover:opacity-100"
                >
                  המשך כאורח (ללא סנכרון ענן)
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          className="text-center text-gray-500 text-xs mt-6 opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
        >
          בחינם לתמיד • ללא כרטיס אשראי
        </motion.p>
      </div>
    </div>
  );
};

export default SignupScreen;
