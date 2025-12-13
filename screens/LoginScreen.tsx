/**
 * LoginScreen - Refactored
 * 
 * UI components extracted to components/auth/
 * Auth logic extracted to hooks/useLoginAuth.ts
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UltraCard } from '../components/ui/UltraCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  GoogleIcon,
  LockIcon,
  UserIcon,
  SparklesIcon,
  ArrowRightIcon,
  AlertIcon
} from '../components/icons';
import { FloatingParticles, FeatureBadge } from '../components/auth';
import { useLoginAuth } from '../hooks/useLoginAuth';

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onSkip: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignup, onSkip }) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading: loading,
    handleEmailLogin: handleLogin,
    handleGoogleLogin,
  } = useLoginAuth();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)]">
      {/* Enhanced Cinematic Background */}
      <div className="absolute inset-0 z-0">
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
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--dynamic-accent-glow), transparent)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(var(--dynamic-accent-start) 1px, transparent 1px),
                                linear-gradient(90deg, var(--dynamic-accent-start) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <FloatingParticles />
        <div className="absolute inset-0 bg-noise-pattern opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkip}
          icon={<ArrowRightIcon className="w-5 h-5" />}
          className="rounded-full bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/10"
        />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        >
          <UltraCard variant="glass" glowColor="cyan" className="p-8 border-white/10 bg-cosmos-black/40 backdrop-blur-3xl">
            <div className="text-center mb-8 relative">
              {/* Brand Logo Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-accent-cyan/20 blur-[40px] rounded-full pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center shadow-lg shadow-accent-cyan/20">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-black mb-2 tracking-tight">
                  <span className="text-white">Spark</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-violet">OS</span>
                </h1>
                <p className="text-gray-400 text-sm font-medium tracking-wide">ברוכים השבים</p>
              </motion.div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<UserIcon className="w-5 h-5" />}
                required
              />

              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="סיסמה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<LockIcon className="w-5 h-5" />}
                  required
                />
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-gray-400 hover:text-accent-cyan transition-colors mt-1">
                    שכחתי סיסמה?
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 overflow-hidden"
                  >
                    <AlertIcon className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full justify-center text-lg font-bold py-3.5 mt-2"
                disabled={loading}
                isLoading={loading}
                variant="primary"
                size="lg"
              >
                התחברות
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-[1px] bg-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0A0A0F] px-3 text-gray-500 tracking-wider border border-white/5 rounded-full py-0.5">או</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleLogin}
                isLoading={loading}
                variant="secondary"
                className="w-full py-3.5"
                icon={<GoogleIcon className="w-5 h-5" />}
              >
                התחבר עם Google
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-gray-400 text-sm">
                אין לך חשבון?{' '}
                <button
                  onClick={onNavigateToSignup}
                  className="text-accent-cyan font-semibold hover:text-accent-violet transition-colors"
                >
                  הרשמה
                </button>
              </p>
            </div>
          </UltraCard>
        </motion.div>
      </div>
      {/* Bottom tagline */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-gray-600 text-[10px] tracking-widest uppercase opacity-60">
          Smart Personal Architect • OS 2.0
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
