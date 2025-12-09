import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldExclamationIcon,
  SparklesIcon,
  CheckCircleIcon,
  CloseIcon,
  StopwatchIcon,
} from './icons';
import * as geminiService from '../services/geminiService';
import * as dataService from '../services/dataService';
import { ComfortZoneChallenge } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { todayKey } from '../utils/dateUtils';
import LoadingSpinner from './LoadingSpinner';
import { toDateKey } from '../utils/dateUtils';

const HOURS_24 = 24 * 60 * 60 * 1000;

interface ComfortZoneWidgetProps {
  title?: string;
  compact?: boolean;
}

const ComfortZoneWidget: React.FC<ComfortZoneWidgetProps> = ({ title }) => {
  const [challenge, setChallenge] = useState<ComfortZoneChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { triggerHaptic } = useHaptics();
  const holdTimerRef = useRef<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    const stored = dataService.getComfortZoneChallenge();
    const today = toDateKey();

    if (stored && stored.date === today) {
      setChallenge(stored);
    } else {
      // If stored is old or null, reset to null so user can generate new
      setChallenge(null);
    }
  }, []);

  useEffect(() => {
    if (challenge?.status === 'active' && challenge.revealedAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const revealed = new Date(challenge.revealedAt!).getTime();
        const diff = revealed + HOURS_24 - now;

        if (diff <= 0) {
          setChallenge(prev => {
            if (!prev) return null;
            const failed = { ...prev, status: 'failed' as const };
            dataService.setComfortZoneChallenge(failed);
            return failed;
          });
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [challenge]);

  const generateChallenge = async () => {
    setIsLoading(true);
    try {
      const result = await geminiService.generateComfortZoneChallenge('medium'); // Default to medium
      const newChallenge: ComfortZoneChallenge = {
        id: `cz-${Date.now()}`,
        date: todayKey(),
        text: result.text,
        difficulty: result.difficulty,
        status: 'hidden',
      };
      setChallenge(newChallenge);
      dataService.setComfortZoneChallenge(newChallenge);
    } catch (e) {
      console.error('Failed to generate challenge', e);
    } finally {
      setIsLoading(false);
    }
  };

  const revealChallenge = useCallback(() => {
    if (!challenge) return;
    triggerHaptic('heavy');
    const revealed: ComfortZoneChallenge = {
      ...challenge,
      status: 'active',
      revealedAt: new Date().toISOString(),
    };
    setChallenge(revealed);
    dataService.setComfortZoneChallenge(revealed);
  }, [challenge, triggerHaptic]);

  const handleTouchStart = () => {
    if (challenge?.status !== 'hidden') return;
    setIsHolding(true);
    triggerHaptic('light');
    holdTimerRef.current = window.setTimeout(() => {
      revealChallenge();
      setIsHolding(false);
    }, 1500); // 1.5s hold to reveal
  };

  const handleTouchEnd = () => {
    setIsHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const completeChallenge = () => {
    if (!challenge) return;
    triggerHaptic('medium');
    const completed: ComfortZoneChallenge = { ...challenge, status: 'completed' };
    setChallenge(completed);
    dataService.setComfortZoneChallenge(completed);
  };

  const forfeitChallenge = () => {
    if (!challenge) return;
    if (confirm('לוותר על האתגר להיום?')) {
      const failed: ComfortZoneChallenge = { ...challenge, status: 'failed' };
      setChallenge(failed);
      dataService.setComfortZoneChallenge(failed);
    }
  };

  if (!challenge) {
    return (
      <button
        onClick={generateChallenge}
        disabled={isLoading}
        className="w-full spark-card p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] hover:bg-white/5 transition-all group"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <ShieldExclamationIcon className="w-12 h-12 text-[var(--text-secondary)] group-hover:text-[var(--dynamic-accent-highlight)] transition-colors" />
            <div className="text-center">
              <h3 className="font-bold text-white">{title || "שובר הנוחות"}</h3>
              <p className="text-sm text-[var(--text-secondary)]">האם יש לך אומץ לאתגר יומי?</p>
            </div>
          </>
        )}
      </button>
    );
  }

  if (challenge.status === 'hidden') {
    return (
      <div
        className={`spark-card relative overflow-hidden p-8 text-center select-none cursor-pointer transition-all duration-500 ${isHolding ? 'scale-[0.98] ring-4 ring-[var(--dynamic-accent-start)]/50' : ''}`}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', // Indigo to Slate
          borderColor: 'var(--dynamic-accent-start)',
        }}
      >
        {/* Glitch/Noise overlay */}
        <div
          className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300 ${isHolding ? 'opacity-40' : ''}`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div
            className={`p-4 rounded-full bg-white/5 border border-white/10 transition-all duration-1000 ${isHolding ? 'animate-pulse shadow-[0_0_30px_var(--dynamic-accent-glow)]' : ''}`}
          >
            <SparklesIcon className="w-10 h-10 text-[var(--dynamic-accent-highlight)]" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-widest uppercase">מסתורי</h3>
          <p className="text-sm text-gray-400">{isHolding ? 'חושף...' : 'לחץ ארוך לחשיפה'}</p>
        </div>

        {/* Progress ring for hold */}
        {isHolding && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <rect
              width="100%"
              height="100%"
              fill="none"
              stroke="var(--dynamic-accent-start)"
              strokeWidth="4"
              strokeDasharray="1000"
              strokeDashoffset="1000"
              className="animate-[dash_1.5s_linear_forwards]"
            />
          </svg>
        )}
        <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
      </div>
    );
  }

  if (challenge.status === 'active') {
    return (
      <div className="spark-card p-5 border-l-4 border-l-[var(--dynamic-accent-start)] relative overflow-hidden animate-flip-in">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--dynamic-accent-highlight)] flex items-center gap-1">
            <ShieldExclamationIcon className="w-4 h-4" />
            {title || "אתגר יומי"}
          </span>
          <div className="flex items-center gap-1 text-xs font-mono text-[var(--text-secondary)] bg-black/20 px-2 py-1 rounded-full">
            <StopwatchIcon className="w-3 h-3" />
            {timeLeft}
          </div>
        </div>

        <p className="text-lg font-bold text-white mb-6 leading-snug">{challenge.text}</p>

        <div className="flex gap-3">
          <button
            onClick={completeChallenge}
            className="flex-1 bg-[var(--accent-gradient)] text-white font-bold py-2 rounded-xl text-sm shadow-lg shadow-[var(--dynamic-accent-start)]/20 active:scale-95 transition-transform"
          >
            הושלם!
          </button>
          <button
            onClick={forfeitChallenge}
            className="px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors"
          >
            וותר
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`spark-card p-5 flex items-center gap-4 ${challenge.status === 'completed' ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30 opacity-60'}`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${challenge.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
      >
        {challenge.status === 'completed' ? (
          <CheckCircleIcon className="w-6 h-6" />
        ) : (
          <CloseIcon className="w-6 h-6" />
        )}
      </div>
      <div>
        <h3 className="font-bold text-white">
          {challenge.status === 'completed' ? 'אתגר הושלם!' : 'אתגר נכשל'}
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">{challenge.text}</p>
      </div>
    </div>
  );
};

export default React.memo(ComfortZoneWidget);
