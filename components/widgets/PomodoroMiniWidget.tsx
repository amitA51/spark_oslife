import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, StopIcon } from '../icons';
import { useSettings } from '../../src/contexts/SettingsContext';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';

type PomodoroPhase = 'work' | 'short-break' | 'long-break' | 'idle';

interface PomodoroMiniWidgetProps {
    onSessionComplete?: (phase: PomodoroPhase, duration: number) => void;
}

const PomodoroMiniWidget: React.FC<PomodoroMiniWidgetProps> = ({ onSessionComplete }) => {
    const { settings } = useSettings();
    // Use enhanced haptics
    const { hapticTap, hapticSuccess, triggerEffect } = useHaptics();
    // Use enhanced sounds
    const { playSuccess, playComplete, playTick } = useSound();

    const pomodoroSettings = settings.pomodoroSettings;

    const [phase, setPhase] = useState<PomodoroPhase>('idle');
    const [timeLeft, setTimeLeft] = useState(pomodoroSettings.workDuration * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);

    const phaseConfig = {
        work: {
            duration: pomodoroSettings.workDuration * 60,
            label: 'עבודה',
            color: 'from-rose-500 to-orange-500',
            bgColor: 'bg-rose-500/20',
            emoji: '💪',
        },
        'short-break': {
            duration: pomodoroSettings.shortBreak * 60,
            label: 'הפסקה קצרה',
            color: 'from-emerald-500 to-teal-500',
            bgColor: 'bg-emerald-500/20',
            emoji: '☕',
        },
        'long-break': {
            duration: pomodoroSettings.longBreak * 60,
            label: 'הפסקה ארוכה',
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'bg-blue-500/20',
            emoji: '🌴',
        },
        idle: {
            duration: pomodoroSettings.workDuration * 60,
            label: 'מוכן להתחיל',
            color: 'from-gray-500 to-gray-600',
            bgColor: 'bg-white/5',
            emoji: '⏱️',
        },
    };

    const currentConfig = phaseConfig[phase];

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = useCallback(() => {
        if (phase === 'idle') {
            setPhase('work');
            setTimeLeft(pomodoroSettings.workDuration * 60);
        }
        setIsRunning(true);
        startTimeRef.current = Date.now();
        hapticTap();
        playTick();
    }, [phase, pomodoroSettings.workDuration, hapticTap, playTick]);

    const pauseTimer = useCallback(() => {
        setIsRunning(false);
        pausedTimeRef.current = timeLeft;
        hapticTap();
    }, [timeLeft, hapticTap]);

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        setPhase('idle');
        setTimeLeft(pomodoroSettings.workDuration * 60);
        setSessionsCompleted(0);
        triggerEffect('warning', 'medium');
    }, [pomodoroSettings.workDuration, triggerEffect]);

    const completePhase = useCallback(() => {
        // Use enhanced sounds and haptics
        playComplete();
        hapticSuccess();
        onSessionComplete?.(phase, currentConfig.duration - timeLeft);

        if (phase === 'work') {
            const newSessions = sessionsCompleted + 1;
            setSessionsCompleted(newSessions);

            // Long break after X sessions
            if (newSessions % pomodoroSettings.sessionsUntilLongBreak === 0) {
                setPhase('long-break');
                setTimeLeft(pomodoroSettings.longBreak * 60);
            } else {
                setPhase('short-break');
                setTimeLeft(pomodoroSettings.shortBreak * 60);
            }
        } else {
            // After break, go back to work
            setPhase('work');
            setTimeLeft(pomodoroSettings.workDuration * 60);
        }

        setIsRunning(false);
    }, [
        phase,
        sessionsCompleted,
        pomodoroSettings,
        timeLeft,
        currentConfig.duration,
        playComplete,
        hapticSuccess,
        onSessionComplete
    ]);

    // Timer logic
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        completePhase();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, completePhase, timeLeft]);

    // Calculate progress for circular indicator
    const progress = phase !== 'idle'
        ? ((currentConfig.duration - timeLeft) / currentConfig.duration) * 100
        : 0;

    const circumference = 2 * Math.PI * 40; // radius = 40
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-2xl p-4 border border-white/10 backdrop-blur-xl ${currentConfig.bgColor}`}
        >
            <div className="flex items-center gap-4">
                {/* Circular Timer */}
                <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#pomodoroGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            initial={false}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                        <defs>
                            <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={phase === 'work' ? '#f43f5e' : phase === 'short-break' ? '#10b981' : '#3b82f6'} />
                                <stop offset="100%" stopColor={phase === 'work' ? '#f97316' : phase === 'short-break' ? '#14b8a6' : '#6366f1'} />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Time display in center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-white font-mono">
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-xs text-gray-400">{currentConfig.emoji}</span>
                    </div>
                </div>

                {/* Info and controls */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{currentConfig.label}</span>
                        {sessionsCompleted > 0 && (
                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                                {sessionsCompleted} סשנים
                            </span>
                        )}
                    </div>

                    {/* Session indicators */}
                    <div className="flex gap-1 mb-3">
                        {Array.from({ length: pomodoroSettings.sessionsUntilLongBreak }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all ${i < (sessionsCompleted % pomodoroSettings.sessionsUntilLongBreak)
                                    ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                                    : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        <AnimatePresence mode="wait">
                            {!isRunning ? (
                                <motion.button
                                    key="play"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    onClick={startTimer}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    <span>{phase === 'idle' ? 'התחל' : 'המשך'}</span>
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="pause"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    onClick={pauseTimer}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all active:scale-95"
                                >
                                    <PauseIcon className="w-4 h-4" />
                                    <span>הפסק</span>
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {phase !== 'idle' && (
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={resetTimer}
                                className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                aria-label="אפס טיימר"
                            >
                                <StopIcon className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PomodoroMiniWidget;
