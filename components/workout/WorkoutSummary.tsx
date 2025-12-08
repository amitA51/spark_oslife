import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSession } from '../../types';
import { TrophyIcon, FlameIcon, CloseIcon, CheckCircleIcon } from '../icons';
import { getWorkoutSessions } from '../../services/dataService';
import { calculatePRsFromHistory, isNewPR } from '../../services/prService';
import './workout-premium.css';

interface WorkoutSummaryProps {
  session: Partial<WorkoutSession>;
  onClose: () => void;
  onSaveAsTemplate?: () => void;
}

/**
 * Animated Counter Component
 */
const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}{suffix}</span>;
};

/**
 * Stat Card Component
 */
const StatCard = ({
  icon,
  label,
  value,
  suffix,
  gradient,
  delay = 0
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    className={`workout-glass-card rounded-2xl p-4 relative overflow-hidden group`}
  >
    {/* Gradient Background */}
    <div className={`absolute inset-0 ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

    {/* Top Shine */}
    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black text-white">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
    </div>
  </motion.div>
);

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({ session, onClose, onSaveAsTemplate }) => {
  // Calculate stats with useMemo
  const totalVolume = React.useMemo(
    () =>
      session.exercises?.reduce((sum, ex) => {
        return (
          sum +
          ex.sets.reduce((setSum, set) => {
            if (set.completedAt && set.weight && set.reps) {
              return setSum + set.weight * set.reps;
            }
            return setSum;
          }, 0)
        );
      }, 0) || 0,
    [session.exercises]
  );

  const totalSets = React.useMemo(
    () =>
      session.exercises?.reduce((sum, ex) => sum + ex.sets.filter(s => s.completedAt).length, 0) ||
      0,
    [session.exercises]
  );

  const duration = React.useMemo(
    () =>
      session.startTime && session.endTime
        ? Math.round(
          (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) /
          1000 /
          60
        )
        : 0,
    [session.startTime, session.endTime]
  );

  const [prsCount, setPrsCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const computePRs = async () => {
      if (!session.exercises || session.exercises.length === 0) {
        if (!cancelled) setPrsCount(0);
        return;
      }

      try {
        const allSessions = await getWorkoutSessions();
        const currentStartMs = session.startTime ? new Date(session.startTime).getTime() : null;

        const historyBefore = currentStartMs
          ? allSessions.filter(s => {
            if (!s.startTime) return true;
            return new Date(s.startTime).getTime() < currentStartMs;
          })
          : allSessions;

        const basePrMap = calculatePRsFromHistory(historyBefore);
        let count = 0;

        session.exercises.forEach(ex => {
          const existing = basePrMap.get(ex.name);
          const hasNewPr = ex.sets?.some(set => isNewPR(set, existing));
          if (hasNewPr) count += 1;
        });

        if (!cancelled) setPrsCount(count);
      } catch (error) {
        console.error('Failed to compute PR count for summary', error);
        if (!cancelled) setPrsCount(0);
      }
    };

    computePRs();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const [view, setView] = React.useState<'overview' | 'details'>('overview');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[12000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={e => e.stopPropagation()}
          className="workout-glass-card rounded-3xl p-6 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Celebration Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -20,
                  x: Math.random() * 400 - 200,
                  opacity: 1,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{
                  y: 400,
                  opacity: 0,
                  rotate: Math.random() * 720
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#6366f1', '#22d3ee', '#a855f7', '#10b981', '#f59e0b'][i % 5],
                  left: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-black workout-gradient-text-accent flex items-center gap-2">
                אימון הושלם!
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
                >
                  🎉
                </motion.span>
              </h2>
              <p className="text-sm text-white/50 mt-1">כל הכבוד על האימון!</p>
            </motion.div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-white/5 rounded-xl p-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setView('overview')}
                  className={`px-3 py-1.5 rounded-lg font-semibold tracking-wide transition-all ${view === 'overview'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                    }`}
                >
                  סקירה
                </button>
                <button
                  type="button"
                  onClick={() => setView('details')}
                  className={`px-3 py-1.5 rounded-lg font-semibold tracking-wide transition-all ${view === 'details'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                    }`}
                >
                  פרטים
                </button>
              </div>

              {/* Close Button */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white/50" />
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {view === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <StatCard
                    icon={<FlameIcon className="w-4 h-4 text-orange-400" />}
                    label="נפח"
                    value={totalVolume}
                    suffix=" ק״ג"
                    gradient="bg-gradient-to-br from-orange-500 to-red-500"
                    delay={0.3}
                  />
                  <StatCard
                    icon={<CheckCircleIcon className="w-4 h-4 text-cyan-400" />}
                    label="סטים"
                    value={totalSets}
                    gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
                    delay={0.4}
                  />
                  <StatCard
                    icon={<span className="text-sm">⏱️</span>}
                    label="משך"
                    value={duration}
                    suffix=" דק'"
                    gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                    delay={0.5}
                  />
                  <StatCard
                    icon={<TrophyIcon className="w-4 h-4 text-yellow-400" />}
                    label="שיאים"
                    value={prsCount ?? 0}
                    gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
                    delay={0.6}
                  />
                </div>

                {/* Exercise List Preview */}
                {session.exercises && session.exercises.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mb-6"
                  >
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[var(--cosmos-accent-primary)] rounded-full" />
                      תרגילים ({session.exercises.length})
                    </h3>
                    <div className="space-y-2">
                      {session.exercises.map((ex, i) => {
                        const completedSets = ex.sets.filter(s => s.completedAt).length;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + i * 0.05 }}
                            className="flex justify-between items-center py-2.5 px-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                          >
                            <span className="text-sm text-white font-medium">{ex.name}</span>
                            <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-lg">
                              {completedSets} סטים
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Detailed Exercise Breakdown */}
                {session.exercises && session.exercises.length > 0 && (
                  <div className="mb-6 max-h-72 overflow-y-auto custom-scrollbar space-y-3">
                    {session.exercises.map((ex, i) => {
                      const completed = ex.sets.filter(s => s.completedAt);
                      if (completed.length === 0) return null;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/5"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-white font-semibold">{ex.name}</span>
                            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
                              {completed.length} סטים
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-[10px] text-white/40 mb-2 pb-1 border-b border-white/5">
                            <div className="text-right">סט</div>
                            <div className="text-center">משקל × חזרות</div>
                            <div className="text-left">נפח</div>
                          </div>
                          {completed.map((set, idx) => {
                            const volume = (set.weight || 0) * (set.reps || 0);
                            return (
                              <div
                                key={idx}
                                className="grid grid-cols-3 text-[11px] text-white/70 py-1.5 border-b border-white/5 last:border-0"
                              >
                                <div className="text-right font-medium">#{idx + 1}</div>
                                <div className="text-center">
                                  <span className="text-[var(--cosmos-accent-primary)]">{set.weight || 0}</span>
                                  <span className="text-white/30"> × </span>
                                  <span>{set.reps || 0}</span>
                                </div>
                                <div className="text-left text-white/50">{volume} ק״ג</div>
                              </div>
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {onSaveAsTemplate && (
              <motion.button
                onClick={onSaveAsTemplate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[var(--cosmos-accent-primary)]/30 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>💾</span>
                שמור כתבנית
              </motion.button>
            )}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] text-black rounded-2xl font-bold shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all"
            >
              סיום
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkoutSummary;

