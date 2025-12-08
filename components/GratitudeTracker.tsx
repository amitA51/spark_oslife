import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonalItem } from '../types';
import { SparklesIcon, HeartIcon, CheckCheckIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { useData } from '../src/contexts/DataContext';
import { useSettings } from '../src/contexts/SettingsContext';

interface GratitudeTrackerProps {
  /** Number of gratitude inputs */
  inputCount?: number;
  /** Show streak counter */
  showStreak?: boolean;
}

const inputStyles = `
  w-full bg-white/[0.03] border border-white/[0.08] 
  text-white rounded-xl p-3.5 
  focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 
  focus:border-[var(--dynamic-accent-start)] 
  focus:bg-white/[0.05]
  transition-all duration-200
  placeholder:text-white/30
`;

const gratitudeEmojis = ['🙏', '💝', '✨', '🌟', '💫', '🌈', '☀️', '🌸'];

const GratitudeTracker: React.FC<GratitudeTrackerProps> = ({
  inputCount = 3,
  showStreak,
}) => {
  const { personalItems, addPersonalItem } = useData();
  const { settings } = useSettings();

  // Use prop if provided, otherwise fallback to settings
  const shouldShowStreak = showStreak ?? settings.visualSettings?.showStreaks ?? true;

  const [todayGratitude, setTodayGratitude] = useState<PersonalItem | null>(null);
  const [inputs, setInputs] = useState<string[]>(Array(inputCount).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Check if today's gratitude exists
  useEffect(() => {
    const today = new Date().toDateString();
    const found = personalItems.find(
      item => item.type === 'gratitude' && new Date(item.createdAt).toDateString() === today
    );
    setTodayGratitude(found || null);
  }, [personalItems]);

  // Calculate streak
  const streak = useMemo(() => {
    if (!personalItems) return 0;

    const gratitudes = personalItems
      .filter(item => item.type === 'gratitude')
      .map(item => new Date(item.createdAt).toDateString())
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let count = 0;
    let currentDate = new Date();

    for (const dateStr of gratitudes) {
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - count);

      if (expectedDate.toDateString() === dateStr) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }, [personalItems]);

  const handleInputChange = useCallback((index: number, value: string) => {
    setInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  }, []);

  const canSubmit = useMemo(() =>
    inputs.every(i => i.trim() !== ''),
    [inputs]
  );

  const handleSave = useCallback(async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    if (window.navigator.vibrate) {
      window.navigator.vibrate([50, 30, 50]);
    }

    try {
      await addPersonalItem({
        type: 'gratitude',
        title: `הכרת תודה - ${new Date().toLocaleDateString('he-IL')}`,
        content: inputs.join('\n'),
      } as any);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save gratitude:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [inputs, canSubmit, addPersonalItem]);

  const randomEmoji = useMemo(() =>
    gratitudeEmojis[Math.floor(Math.random() * gratitudeEmojis.length)],
    []
  );

  // Already submitted today - show gratitudes
  if (todayGratitude) {
    const gratitudes = (todayGratitude.content || '').split('\n');

    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.05]"
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))',
          }}
        />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {randomEmoji}
              </motion.span>
              אני מודה על...
            </h2>

            {shouldShowStreak && streak > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-medium"
              >
                🔥 {streak} ימים רצופים
              </motion.span>
            )}
          </div>

          {/* Gratitude list */}
          <ul className="space-y-3">
            {gratitudes.map((g, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 text-white/90"
              >
                <HeartIcon className="w-4 h-4 mt-0.5 text-[var(--dynamic-accent-start)] flex-shrink-0" />
                <span>{g}</span>
              </motion.li>
            ))}
          </ul>

          {/* Decorative sparkles */}
          <motion.div
            className="absolute top-4 right-4 opacity-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <SparklesIcon className="w-16 h-16 text-[var(--dynamic-accent-start)]" />
          </motion.div>
        </div>
      </motion.section>
    );
  }

  // Input form
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
          על מה אני מודה היום?
        </h2>

        {shouldShowStreak && streak > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-medium">
            🔥 {streak}
          </span>
        )}
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        {inputs.map((val, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <input
              type="text"
              value={val}
              onChange={e => handleInputChange(i, e.target.value)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              className={inputStyles}
              placeholder={`${i + 1}. על מה אתה מודה?`}
            />

            {/* Checkmark when filled */}
            <AnimatePresence>
              {val.trim() && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCheckIcon className="w-4 h-4 text-emerald-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSave}
        disabled={isSubmitting || !canSubmit}
        whileHover={canSubmit ? { scale: 1.02 } : {}}
        whileTap={canSubmit ? { scale: 0.98 } : {}}
        className={`
          mt-4 w-full py-3.5 px-4 rounded-xl font-bold
          flex items-center justify-center gap-2
          transition-all duration-200
          ${canSubmit
            ? 'bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white shadow-lg shadow-[var(--dynamic-accent-glow)]/30'
            : 'bg-white/[0.05] text-white/40 cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? (
          <LoadingSpinner size="sm" />
        ) : showSuccess ? (
          <>
            <CheckCheckIcon className="w-5 h-5" />
            נשמר!
          </>
        ) : (
          <>
            <HeartIcon className="w-5 h-5" />
            שמור הכרת תודה
          </>
        )}
      </motion.button>

      {/* Progress indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {inputs.map((val, i) => (
          <motion.div
            key={i}
            className={`
              w-2 h-2 rounded-full transition-colors duration-200
              ${val.trim() ? 'bg-[var(--dynamic-accent-start)]' : 'bg-white/10'}
            `}
            animate={focusedIndex === i ? { scale: 1.3 } : { scale: 1 }}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default React.memo(GratitudeTracker);
