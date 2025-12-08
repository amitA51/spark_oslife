import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ClockIcon, XIcon, CheckCheckIcon } from './icons';
import { blockTimeForTask } from '../services/googleCalendarService';
import LoadingSpinner from './LoadingSpinner';
import { toDateKey } from '../utils/dateUtils';

interface TimeBlockerProps {
  /** Task ID to block time for */
  taskId: string;
  /** Task title for the calendar event */
  taskTitle: string;
  /** Callback after successful blocking */
  onSuccess?: () => void;
  /** Compact mode (just a button) */
  compact?: boolean;
}

const durationOptions = [
  { value: 15, label: '15 דק׳' },
  { value: 30, label: '30 דק׳' },
  { value: 45, label: '45 דק׳' },
  { value: 60, label: 'שעה' },
  { value: 90, label: '1.5 שעות' },
  { value: 120, label: '2 שעות' },
  { value: 180, label: '3 שעות' },
];

const quickTimeOptions = [
  { label: 'עכשיו', getTime: () => new Date() },
  { label: 'בעוד שעה', getTime: () => new Date(Date.now() + 60 * 60 * 1000) },
  {
    label: 'מחר 9:00', getTime: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    }
  },
];

const TimeBlocker: React.FC<TimeBlockerProps> = ({
  taskId,
  taskTitle,
  onSuccess,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default to tomorrow at 9 AM
  useEffect(() => {
    if (isOpen && !date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(toDateKey(tomorrow));
      setTime('09:00');
    }
  }, [isOpen, date]);

  const canSubmit = useMemo(() => date && time, [date, time]);

  const handleQuickTime = useCallback((getTime: () => Date) => {
    const d = getTime();
    setDate(toDateKey(d));
    setTime(d.toTimeString().slice(0, 5));
  }, []);

  const handleBlockTime = useCallback(async () => {
    if (!date || !time) {
      setError('נא לבחור תאריך ושעה');
      return;
    }

    setIsBlocking(true);
    setError(null);

    try {
      const startTime = new Date(`${date}T${time}`);
      await blockTimeForTask(taskId, taskTitle, startTime, duration);

      if (window.navigator.vibrate) {
        window.navigator.vibrate([50, 30, 50]);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Error blocking time:', err);
      setError('שגיאה בחסימת הזמן. ודא שאתה מחובר ל-Google Calendar.');
    } finally {
      setIsBlocking(false);
    }
  }, [date, time, duration, taskId, taskTitle, onSuccess]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, []);

  // Closed state - trigger button
  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex items-center gap-2 
          bg-white/[0.03] border border-white/[0.08] 
          hover:border-[var(--dynamic-accent-start)]/50 
          hover:bg-white/[0.05]
          text-white rounded-xl transition-all
          ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
        `}
      >
        <CalendarIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {!compact && 'חסום זמן'}
      </motion.button>
    );
  }

  // Open state - form
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08]"
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--dynamic-accent-start)]" />
              חסימת זמן
            </h4>
            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XIcon className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>

          {/* Quick time options */}
          <div className="flex gap-2">
            {quickTimeOptions.map((opt) => (
              <motion.button
                key={opt.label}
                onClick={() => handleQuickTime(opt.getTime)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition-all"
              >
                {opt.label}
              </motion.button>
            ))}
          </div>

          {/* Date & Time inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">תאריך</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">שעה</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)] transition-all"
              />
            </div>
          </div>

          {/* Duration selector */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              משך זמן
            </label>
            <div className="flex flex-wrap gap-1.5">
              {durationOptions.map((opt) => (
                <motion.button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all
                    ${duration === opt.value
                      ? 'bg-[var(--dynamic-accent-start)] text-white shadow-lg shadow-[var(--dynamic-accent-glow)]/30'
                      : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white'
                    }
                  `}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            onClick={handleBlockTime}
            disabled={isBlocking || !canSubmit}
            whileHover={canSubmit ? { scale: 1.01 } : {}}
            whileTap={canSubmit ? { scale: 0.99 } : {}}
            className={`
              w-full py-2.5 rounded-xl text-sm font-semibold
              flex items-center justify-center gap-2
              transition-all duration-200
              ${canSubmit
                ? 'bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white shadow-lg shadow-[var(--dynamic-accent-glow)]/30'
                : 'bg-white/[0.05] text-white/40 cursor-not-allowed'
              }
            `}
          >
            {isBlocking ? (
              <LoadingSpinner size="sm" />
            ) : showSuccess ? (
              <>
                <CheckCheckIcon className="w-4 h-4" />
                נחסם בהצלחה!
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4" />
                חסום זמן
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(TimeBlocker);
