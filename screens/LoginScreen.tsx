import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signInWithGoogle, checkGoogleRedirectResult } from '../services/authService';
import { GoogleIcon, LockIcon, UserIcon, SparklesIcon } from '../components/icons';
import { PremiumButton, PremiumInput } from '../components/premium/PremiumComponents';

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onSkip: () => void;
}

// Floating particles component
const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: `radial-gradient(circle, var(--dynamic-accent-start), transparent)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, -10, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Feature badge component
const FeatureBadge: React.FC<{ icon: React.ReactNode; label: string; delay: number }> = ({
  icon,
  label,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
  >
    <span className="text-[var(--dynamic-accent-start)]">{icon}</span>
    <span className="text-xs font-medium text-gray-300">{label}</span>
  </motion.div>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignup, onSkip }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check for Google redirect result (for mobile auth flow)
    const handleRedirectResult = async () => {
      try {
        setIsLoading(true);
        const user = await checkGoogleRedirectResult();
        if (user) {
          // User successfully signed in via redirect, auth state will update automatically
          console.log('Google redirect sign-in successful');
        }
      } catch (err: any) {
        setError(err.message || 'שגיאה בהתחברות עם Google');
      } finally {
        setIsLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)]">
      {/* Enhanced Cinematic Background */}
      <div className="absolute inset-0 z-0">
        {/* Primary gradient orbs */}
        <motion.div
          className="absolute top-[-30%] right-[-20%] w-[900px] h-[900px] rounded-full blur-[150px]"
          style={{ background: 'var(--dynamic-accent-start)' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-30%] left-[-20%] w-[900px] h-[900px] rounded-full blur-[150px]"
          style={{ background: 'var(--dynamic-accent-end)' }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Central glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--dynamic-accent-glow), transparent)' }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(var(--dynamic-accent-start) 1px, transparent 1px),
                              linear-gradient(90deg, var(--dynamic-accent-start) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise-pattern opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg mx-4 p-2">
        {/* Feature badges above card */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <FeatureBadge icon={<span className="text-sm">⚡</span>} label="מהיר ויעיל" delay={0.6} />
          <FeatureBadge icon={<span className="text-sm">🛡️</span>} label="מאובטח" delay={0.7} />
          <FeatureBadge icon={<span className="text-sm">☁️</span>} label="סנכרון ענן" delay={0.8} />
        </motion.div>

        {/* Login Card */}
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
              background: 'linear-gradient(135deg, var(--dynamic-accent-start), transparent 50%, var(--dynamic-accent-end))',
            }}
          />

          {/* Card inner content */}
          <div className="relative bg-[var(--bg-primary)]/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 m-[1px]">
            {/* Logo and branding */}
            <div className="text-center mb-10">
              {/* Animated Logo */}
              <motion.div
                className="relative w-28 h-28 mx-auto mb-6"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* Outer glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: `linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))`,
                    filter: 'blur(20px)',
                  }}
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Logo container */}
                <div
                  className="relative w-full h-full rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))`,
                  }}
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <span className="text-6xl filter drop-shadow-lg">⚡</span>
                </div>
              </motion.div>

              {/* Title with gradient */}
              <motion.h1
                className="text-5xl md:text-6xl font-black tracking-tighter font-heading mb-3"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.8) 50%, var(--dynamic-accent-start) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Spark OS
              </motion.h1>

              <motion.p
                className="text-sm font-semibold tracking-[0.15em] uppercase"
                style={{ color: 'var(--dynamic-accent-start)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ delay: 0.4 }}
              >
                מערכת ההפעלה לחיים שלך
              </motion.p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm text-center backdrop-blur-md"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-5 mb-6">
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

              <PremiumButton
                type="submit"
                isLoading={isLoading}
                className="w-full py-4 text-lg font-bold"
                variant="primary"
              >
                <span className="flex items-center justify-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  התחבר למערכת
                </span>
              </PremiumButton>
            </form>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full h-[1px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, var(--dynamic-accent-start), transparent)',
                    opacity: 0.3,
                  }}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-4 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full border"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--dynamic-accent-start)',
                    color: 'var(--dynamic-accent-start)',
                    opacity: 0.8,
                  }}
                >
                  או
                </span>
              </div>
            </div>

            {/* Google Login */}
            <PremiumButton
              onClick={handleGoogleLogin}
              isLoading={isLoading}
              variant="secondary"
              className="w-full py-4 mb-6"
              icon={<GoogleIcon className="w-5 h-5" />}
            >
              התחבר עם Google
            </PremiumButton>

            {/* Footer links */}
            <div className="text-center space-y-3">
              <p className="text-gray-400 text-sm">
                עדיין אין לך חשבון?{' '}
                <button
                  onClick={onNavigateToSignup}
                  className="font-bold transition-all focus:outline-none ml-1 underline decoration-transparent hover:decoration-current underline-offset-4"
                  style={{ color: 'var(--dynamic-accent-start)' }}
                >
                  הירשם בחינם
                </button>
              </p>
              <button
                onClick={onSkip}
                className="text-gray-500 text-xs hover:text-white transition-colors focus:outline-none tracking-wide opacity-60 hover:opacity-100"
              >
                המשך כאורח (ללא סנכרון ענן)
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          className="text-center text-gray-500 text-xs mt-6 opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
        >
          גרסה 2.0 • נבנה עם ❤️ בישראל
        </motion.p>
      </div>
    </div>
  );
};

export default LoginScreen;
