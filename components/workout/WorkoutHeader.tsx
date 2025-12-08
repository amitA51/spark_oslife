import React from 'react';
import { motion } from 'framer-motion';
import { SettingsIcon, CheckCircleIcon } from '../icons';
import WorkoutTimer from './WorkoutTimer';
import './workout-premium.css';

interface WorkoutHeaderProps {
  seconds: number;
  formatTime: (seconds: number) => string;
  currentExerciseName: string;
  onFinish: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
}

/**
 * Premium Workout Header with glassmorphism timer and animated effects.
 * Features breathing animation, gradient text, and smooth transitions.
 */
const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  seconds,
  formatTime,
  currentExerciseName,
  onFinish,
  onOpenSettings,
  onOpenTutorial,
}) => {
  return (
    <header className="flex justify-between items-center mb-6 pt-[env(safe-area-inset-top,20px)]">
      {/* Finish Button - Premium Style */}
      <motion.button
        onClick={onFinish}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm tracking-wide hover:border-emerald-500/40 hover:from-emerald-500/20 hover:to-green-500/20 transition-all duration-300"
      >
        <CheckCircleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>סיים</span>
      </motion.button>

      {/* Premium Timer Display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="workout-timer-breathe relative"
      >
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] opacity-20 blur-xl" />

        {/* Timer Container */}
        <div className="relative workout-glass-premium rounded-2xl px-6 py-3 workout-pulse-glow">
          {/* Top Shine Line */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Timer Value */}
          <div className="flex flex-col items-center">
            <WorkoutTimer
              seconds={seconds}
              formatTime={formatTime}
              className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight workout-gradient-text-accent drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            />

            {/* Current Exercise Name */}
            {currentExerciseName && (
              <motion.div
                key={currentExerciseName}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-[11px] text-[var(--cosmos-text-muted)] max-w-[180px] truncate font-medium tracking-wide uppercase"
              >
                {currentExerciseName}
              </motion.div>
            )}
          </div>

          {/* Bottom Gradient Line */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--cosmos-accent-primary)]/30 to-transparent" />
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Tutorial Button */}
        <motion.button
          onClick={onOpenTutorial}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-[var(--cosmos-text-muted)] hover:text-white hover:border-[var(--cosmos-accent-primary)]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          title="Tutorial"
        >
          <span className="text-sm font-serif italic font-bold">i</span>
        </motion.button>

        {/* Settings Button */}
        <motion.button
          onClick={onOpenSettings}
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-[var(--cosmos-text-muted)] hover:text-white hover:border-[var(--cosmos-accent-primary)]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </header>
  );
};

export default React.memo(WorkoutHeader);
