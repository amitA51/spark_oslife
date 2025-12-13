import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signUp, signInWithGoogle, checkGoogleRedirectResult } from '../services/authService';
import { UltraCard } from '../components/ui/UltraCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  GoogleIcon,
  LockIcon,
  UserIcon,
  SparklesIcon,
  AlertIcon
} from '../components/icons';
import { FloatingParticles } from '../components/auth';
import LegalModals from '../components/LegalModals';

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
  const [legalModalConfig, setLegalModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    type: 'terms' | 'privacy';
  }>({
    isOpen: false,
    title: '',
    type: 'terms'
  });

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
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
          style={{ background: 'radial-gradient(circle, var(--dynamic-accent-glow), transparent)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(var(--dynamic-accent-end) 1px, transparent 1px),
                              linear-gradient(90deg, var(--dynamic-accent-end) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        <FloatingParticles />
        <div className="absolute inset-0 bg-noise-pattern opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-4 p-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        >
          <UltraCard variant="glass" glowColor="violet" className="p-8 border-white/10 bg-cosmos-black/40 backdrop-blur-3xl">
            <div className="text-center mb-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-accent-violet/20 blur-[40px] rounded-full pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-magenta flex items-center justify-center shadow-lg shadow-accent-violet/20">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tighter font-heading mb-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-violet to-accent-magenta">הצטרף ל-Spark</span>
                </h1>
                <p className="text-gray-400 text-sm font-medium tracking-wide">
                  התחל לנהל את החיים שלך ברמה הבאה
                </p>
              </motion.div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4 mb-5">
              <Input
                label="אימייל"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                icon={<UserIcon className="w-5 h-5" />}
              />

              <Input
                label="סיסמה"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                icon={<LockIcon className="w-5 h-5" />}
              />

              <Input
                label="אימות סיסמה"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                icon={<LockIcon className="w-5 h-5" />}
              />

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
                isLoading={isLoading}
                className="w-full py-4 text-lg font-bold mt-2"
                variant="primary"
                size="lg"
              >
                צור חשבון
              </Button>

              <div className="text-center text-[10px] text-gray-500 mt-3 px-4 leading-tight">
                בלחיצה על "צור חשבון" או "הרשמה עם Google", אני מאשר/ת את <button type="button" onClick={() => setLegalModalConfig({ isOpen: true, title: 'תנאי שימוש', type: 'terms' })} className="underline hover:text-white transition-colors">תנאי השימוש</button> ואת <button type="button" onClick={() => setLegalModalConfig({ isOpen: true, title: 'מדיניות פרטיות', type: 'privacy' })} className="underline hover:text-white transition-colors">מדיניות הפרטיות</button>
              </div>
            </form>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[1px] bg-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A0A0F] px-3 text-gray-500 tracking-wider border border-white/5 rounded-full py-0.5">או</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignup}
              isLoading={isLoading}
              variant="secondary"
              className="w-full py-3.5 mb-5"
              icon={<GoogleIcon className="w-5 h-5" />}
            >
              הרשמה עם Google
            </Button>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-gray-400 text-sm">
                כבר יש לך חשבון?{' '}
                <button
                  onClick={onNavigateToLogin}
                  className="text-accent-violet font-semibold hover:text-accent-magenta transition-colors"
                >
                  התחבר כאן
                </button>
              </p>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="mt-4 text-gray-500 text-xs hover:text-white transition-colors focus:outline-none tracking-wide opacity-60 hover:opacity-100 block mx-auto"
                >
                  המשך כאורח (ללא סנכרון ענן)
                </button>
              )}
            </div>
          </UltraCard>
        </motion.div>

        <motion.p
          className="text-center text-gray-600 text-[10px] tracking-widest uppercase opacity-60 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
        >
          בחינם לתמיד • ללא כרטיס אשראי
        </motion.p>
      </div>

      <LegalModals
        isOpen={legalModalConfig.isOpen}
        onClose={() => setLegalModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={legalModalConfig.title}
        type={legalModalConfig.type}
      />
    </div>
  );
};

export default SignupScreen;
