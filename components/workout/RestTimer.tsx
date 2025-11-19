import React, { useState, useEffect } from 'react';

interface RestTimerProps {
    targetSeconds: number;
    onComplete: () => void;
    onSkip: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({ targetSeconds, onComplete, onSkip }) => {
    const [secondsLeft, setSecondsLeft] = useState(targetSeconds);
    const [isRunning, setIsRunning] = useState(true);

    useEffect(() => {
        if (!isRunning || secondsLeft <= 0) return;

        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    // Vibrate and play sound
                    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, secondsLeft, onComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((targetSeconds - secondsLeft) / targetSeconds) * 100;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in backdrop-blur-sm">
            <div className="bg-[var(--bg-card)] rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-screen-enter">
                <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">מנוחה</h3>

                <div className="relative w-48 h-48 mx-auto mb-6">
                    <svg className="transform -rotate-90 w-48 h-48">
                        <circle
                            cx="96" cy="96" r="88"
                            stroke="var(--border-color)"
                            strokeWidth="8"
                            fill="none"
                        />
                        <circle
                            cx="96" cy="96" r="88"
                            stroke="var(--accent-primary)"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 88}`}
                            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                            className="transition-all duration-1000 ease-linear"
                            style={{
                                filter: secondsLeft <= 5 ? 'drop-shadow(0 0 10px var(--accent-primary))' : 'none'
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span
                            className={`text-5xl font-bold transition-all ${secondsLeft <= 5 ? 'text-red-500 animate-pulse scale-110' : 'text-[var(--text-primary)]'
                                }`}
                        >
                            {formatTime(secondsLeft)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onSkip}
                        className="flex-1 px-6 py-3 bg-[var(--surface-secondary)] rounded-lg font-medium hover:bg-[var(--surface-hover)] transition-all active:scale-95"
                    >
                        דלג
                    </button>
                    <button
                        onClick={() => setSecondsLeft(prev => prev + 30)}
                        className="flex-1 px-6 py-3 bg-[var(--accent-gradient)] text-black rounded-lg font-medium shadow-[0_2px_10px_var(--dynamic-accent-glow)] hover:brightness-110 transition-all active:scale-95"
                    >
                        +30 שניות
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestTimer;
