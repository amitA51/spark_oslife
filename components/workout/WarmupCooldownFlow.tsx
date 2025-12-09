import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WarmupCooldownFlowProps {
  type: 'warmup' | 'cooldown';
  onComplete: () => void;
  onSkip: () => void;
}

interface RoutineItem {
  id: string;
  name: string;
  nameHe: string; // Hebrew name
  duration: number; // seconds
  selected: boolean;
}

// Storage keys for persistence
const WARMUP_STORAGE_KEY = 'warmup_routine_selections';
const COOLDOWN_STORAGE_KEY = 'cooldown_routine_selections';

const DEFAULT_WARMUP: RoutineItem[] = [
  { id: 'w1', name: 'Jumping Jacks', nameHe: 'קפיצות ג׳ק', duration: 60, selected: true },
  { id: 'w2', name: 'Arm Circles', nameHe: 'סיבובי ידיים', duration: 30, selected: true },
  { id: 'w3', name: 'Torso Twists', nameHe: 'סיבובי גו', duration: 30, selected: true },
  { id: 'w4', name: 'Leg Swings', nameHe: 'תנופות רגליים', duration: 45, selected: true },
  { id: 'w5', name: 'High Knees', nameHe: 'ברכיים גבוהות', duration: 45, selected: false },
  { id: 'w6', name: 'Dynamic Squats', nameHe: 'סקוואטים דינמיים', duration: 45, selected: false },
  { id: 'w7', name: 'Lunges', nameHe: 'לאנג׳ים', duration: 45, selected: false },
  { id: 'w8', name: 'Shoulder Rolls', nameHe: 'גלילות כתפיים', duration: 30, selected: false },
];

const DEFAULT_COOLDOWN: RoutineItem[] = [
  { id: 'c1', name: 'Static Stretching', nameHe: 'מתיחות סטטיות', duration: 60, selected: true },
  { id: 'c2', name: 'Deep Breathing', nameHe: 'נשימות עמוקות', duration: 60, selected: true },
  { id: 'c3', name: "Child's Pose", nameHe: 'תנוחת הילד', duration: 45, selected: true },
  { id: 'c4', name: 'Hamstring Stretch', nameHe: 'מתיחת ירכיים אחוריות', duration: 45, selected: false },
  { id: 'c5', name: 'Quad Stretch', nameHe: 'מתיחת ירך קדמית', duration: 45, selected: false },
  { id: 'c6', name: 'Shoulder Stretch', nameHe: 'מתיחת כתפיים', duration: 30, selected: false },
];

/**
 * WarmupCooldownFlow - Redesigned with persistence, Hebrew UI, larger timer
 */
const WarmupCooldownFlow: React.FC<WarmupCooldownFlowProps> = ({ type, onComplete, onSkip }) => {
  const [step, setStep] = useState<'selection' | 'active'>('selection');
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = type === 'warmup' ? WARMUP_STORAGE_KEY : COOLDOWN_STORAGE_KEY;
  const defaultItems = type === 'warmup' ? DEFAULT_WARMUP : DEFAULT_COOLDOWN;

  // Load saved selections on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const selections: Record<string, boolean> = JSON.parse(saved);
        const merged = defaultItems.map(item => ({
          ...item,
          selected: selections[item.id] ?? item.selected,
        }));
        setItems(merged);
      } else {
        setItems(defaultItems);
      }
    } catch {
      setItems(defaultItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save selections whenever they change
  const saveSelections = useCallback((newItems: RoutineItem[]) => {
    const selections: Record<string, boolean> = {};
    newItems.forEach(item => {
      selections[item.id] = item.selected;
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(selections));
    } catch (e) {
      console.error('Failed to save routine selections:', e);
    }
  }, [storageKey]);

  const activeItems = items.filter(i => i.selected);
  const currentItem = activeItems[currentIndex];
  const totalDuration = activeItems.reduce((sum, i) => sum + i.duration, 0);

  // Timer effect
  useEffect(() => {
    if (step === 'active' && currentItem) {
      setTimeLeft(currentItem.duration);
      setIsPaused(false);
    }
  }, [step, currentIndex, currentItem]);

  useEffect(() => {
    if (!isPaused && step === 'active' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && step === 'active' && !isPaused) {
      // Vibrate when exercise ends
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, step, timeLeft]);

  const toggleSelection = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.map(i => (i.id === id ? { ...i, selected: !i.selected } : i));
      saveSelections(updated);
      return updated;
    });
  }, [saveSelections]);

  const startRoutine = useCallback(() => {
    if (activeItems.length === 0) {
      onSkip();
      return;
    }
    setStep('active');
    setCurrentIndex(0);
  }, [activeItems.length, onSkip]);

  const nextExercise = useCallback(() => {
    if (currentIndex < activeItems.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      onComplete();
    }
  }, [currentIndex, activeItems.length, onComplete]);

  const prevExercise = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const progress = currentItem
    ? ((currentItem.duration - timeLeft) / currentItem.duration) * 100
    : 0;

  const isWarning = timeLeft <= 3 && timeLeft > 0;

  return (
    <motion.div
      className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="h-full flex flex-col justify-center p-6 max-w-lg mx-auto safe-area-top safe-area-bottom">
        <AnimatePresence mode="wait">
          {step === 'selection' ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col h-full"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white mb-2">
                  {type === 'warmup' ? 'חימום' : 'צינון'}
                </h2>
                <p className="text-white/60 text-sm">
                  בחר את התרגילים שתרצה לבצע
                </p>
                <p className="text-[var(--cosmos-accent-primary)] text-xs mt-1 font-medium">
                  סה״כ: {formatTime(totalDuration)} • {activeItems.length} תרגילים
                </p>
              </div>

              {/* Exercise List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar pb-4">
                {items.map(item => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSelection(item.id)}
                    className={`p-4 min-h-[60px] rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${item.selected
                      ? 'bg-[var(--cosmos-accent-primary)]/15 border-[var(--cosmos-accent-primary)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.selected
                        ? 'bg-[var(--cosmos-accent-primary)] border-[var(--cosmos-accent-primary)]'
                        : 'border-white/30'
                        }`}>
                        {item.selected && <span className="text-black text-sm">✓</span>}
                      </div>
                      <span className={`font-semibold ${item.selected ? 'text-white' : 'text-white/60'}`}>
                        {item.nameHe}
                      </span>
                    </div>
                    <span className="text-sm text-white/50 tabular-nums">
                      {formatTime(item.duration)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-4 space-y-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onSkip}
                  className="w-full h-14 min-h-[56px] rounded-2xl bg-transparent border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all font-medium"
                >
                  דלג על {type === 'warmup' ? 'החימום' : 'הצינון'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={startRoutine}
                  disabled={activeItems.length === 0}
                  className="w-full h-14 min-h-[56px] rounded-2xl bg-[var(--cosmos-accent-primary)] text-black font-bold text-lg shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  התחל שגרה ({activeItems.length})
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full flex flex-col items-center h-full"
            >
              {/* Progress Header */}
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-white/60 font-medium text-sm">
                  {currentIndex + 1} / {activeItems.length}
                </span>
                <button
                  onClick={onSkip}
                  className="text-white/50 hover:text-white transition-colors text-sm"
                >
                  דלג על הכל
                </button>
              </div>

              {/* Exercise Name */}
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {currentItem?.nameHe}
              </h2>

              {/* Large Circular Timer - 200px */}
              <div className="flex-1 flex items-center justify-center">
                <div
                  onClick={togglePause}
                  className="relative w-[200px] h-[200px] rounded-full cursor-pointer hover:scale-105 transition-transform active:scale-95"
                >
                  {/* Background Ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="10"
                      fill="none"
                    />
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke={isWarning ? '#ef4444' : 'var(--cosmos-accent-primary)'}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 90}
                      strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                      style={{
                        filter: isWarning
                          ? 'drop-shadow(0 0 15px rgba(239,68,68,0.5))'
                          : 'drop-shadow(0 0 10px rgba(99,102,241,0.3))'
                      }}
                    />
                  </svg>

                  {/* Time Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      key={timeLeft}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className={`text-5xl font-black tabular-nums ${isWarning ? 'text-red-500' : timeLeft === 0 ? 'text-green-500' : 'text-white'
                        }`}
                    >
                      {formatTime(timeLeft)}
                    </motion.span>
                    {isPaused && (
                      <span className="text-yellow-400 text-xs font-semibold mt-2 animate-pulse">
                        מושהה
                      </span>
                    )}
                    {timeLeft === 0 && (
                      <span className="text-green-400 text-xs font-semibold mt-2">
                        הושלם!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tip */}
              <p className="text-white/30 text-xs mb-6">
                לחץ על השעון להשהייה/המשך
              </p>

              {/* Navigation Buttons */}
              <div className="w-full flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={prevExercise}
                  disabled={currentIndex === 0}
                  className={`w-16 h-14 min-h-[56px] rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center text-2xl text-white transition-all ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95'
                    }`}
                >
                  →
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={nextExercise}
                  className="flex-1 h-14 min-h-[56px] rounded-2xl bg-green-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:brightness-110 transition-all"
                >
                  {currentIndex === activeItems.length - 1 ? 'סיום' : 'הבא'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top, 0); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </motion.div>
  );
};

export default React.memo(WarmupCooldownFlow);
