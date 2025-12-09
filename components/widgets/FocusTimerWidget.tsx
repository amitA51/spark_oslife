
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, StopIcon } from '../icons';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { useFocusSession, useFocusControls, useFocusStats } from '../../src/contexts/FocusContext';
import { PersonalItem } from '../../types';

interface FocusTimerWidgetProps {
    title?: string;
}

const PRESETS = [
    { label: '25 דק׳', minutes: 25, color: 'from-rose-500 to-orange-500' },
    { label: '45 דק׳', minutes: 45, color: 'from-violet-500 to-purple-500' },
    { label: '60 דק׳', minutes: 60, color: 'from-cyan-500 to-blue-500' },
] as const;

const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({ title = 'טיימר למידה' }) => {
    const { triggerHaptic } = useHaptics();
    useSound(); // Hook called for side effects only

    // Focus Context Hooks - using useFocusSession for full context
    const { timeRemaining, progress, isPaused, activeSession, isActive } = useFocusSession();
    const { startSession, pauseSession, resumeSession, cancelSession } = useFocusControls();
    const { stats } = useFocusStats();

    const [selectedPreset, setSelectedPreset] = useState(0);

    // Initial time logic for display when not active
    const currentPreset = PRESETS[selectedPreset] ?? PRESETS[0];
    const initialDuration = currentPreset.minutes * 60 * 1000;

    // Display values
    const validTimeRemaining = isActive ? timeRemaining : initialDuration;
    // Context progress is 0 to 1. widget expects 0 to 1 for strokeDashoffset calculation (or 0-100 if math differs).
    const validProgress = isActive ? progress : 0;

    const formatTime = (ms: number): string => {
        const totalSeconds = Math.ceil(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePresetSelect = useCallback((index: number) => {
        if (isActive) return;
        triggerHaptic('light');
        setSelectedPreset(index);
    }, [isActive, triggerHaptic]);

    const handleStart = useCallback(() => {
        triggerHaptic('medium');
        // Create a dummy quick focus task
        const quickTask: PersonalItem = {
            id: `quick-focus-${Date.now()}`,
            title: title,
            type: 'task',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCompleted: false,
            priority: 'medium'
        };
        startSession(quickTask, currentPreset.minutes);
    }, [triggerHaptic, startSession, currentPreset.minutes, title]);

    const handlePause = useCallback(() => {
        triggerHaptic('light');
        pauseSession();
    }, [triggerHaptic, pauseSession]);

    const handleResume = useCallback(() => {
        triggerHaptic('light');
        resumeSession();
    }, [triggerHaptic, resumeSession]);

    const handleStop = useCallback(() => {
        triggerHaptic('medium');
        cancelSession(); // Or endSession() depending on desire to save
    }, [triggerHaptic, cancelSession]);

    const circumference = 2 * Math.PI * 54;
    // strokeDashoffset: full (C) when progress 0? No, usually empty at start?
    // If progress 0 -> offset C (empty). If progress 1 -> offset 0 (full).
    const strokeDashoffset = circumference * (1 - validProgress);

    return (
        <div className="spark-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    📚 {activeSession ? activeSession.item.title : title}
                </h3>
                {stats.todaySessions > 0 && (
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                        {stats.todaySessions} סשנים היום
                    </span>
                )}
            </div>

            <div className="flex items-center justify-center mb-5">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <motion.circle
                            cx="60" cy="60" r="54" fill="none"
                            stroke={`url(#timerGrad-${selectedPreset})`}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            initial={false}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                        <defs>
                            <linearGradient id="timerGrad-0" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#f97316" />
                            </linearGradient>
                            <linearGradient id="timerGrad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                            <linearGradient id="timerGrad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white font-mono">
                            {formatTime(validTimeRemaining)}
                        </span>
                        {isActive && <span className="text-[10px] text-gray-400 mt-1">בריכוז...</span>}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                {PRESETS.map((preset, index) => (
                    <button
                        key={index}
                        onClick={() => handlePresetSelect(index)}
                        disabled={isActive}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${selectedPreset === index
                            ? `bg-gradient-to-r ${preset.color} text-white shadow-lg`
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50'
                            }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <AnimatePresence mode="wait">
                    {!isActive ? (
                        <motion.button
                            key="start"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={handleStart}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${currentPreset.color} text-white font-medium shadow-lg`}
                        >
                            <PlayIcon className="w-5 h-5" /><span>התחל</span>
                        </motion.button>
                    ) : (
                        <>
                            <motion.button
                                key={isPaused ? "resume" : "pause"}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={isPaused ? handleResume : handlePause}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-medium"
                            >
                                {isPaused ? (
                                    <><PlayIcon className="w-5 h-5" /><span>המשך</span></>
                                ) : (
                                    <><PauseIcon className="w-5 h-5" /><span>הפסק</span></>
                                )}
                            </motion.button>
                            <motion.button
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={handleStop}
                                className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white"
                                aria-label="אפס"
                            >
                                <StopIcon className="w-5 h-5" />
                            </motion.button>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FocusTimerWidget;
