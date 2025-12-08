import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BodyWeightEntry } from '../../types';
import { saveBodyWeight, getBodyWeightHistory } from '../../services/dataService';

interface BodyWeightTrackerProps {
  onClose: () => void;
  onSave: (weight: number) => void;
}

/**
 * BodyWeightTracker - Redesigned with proper sparkline, numpad input, and Hebrew UI
 */
const BodyWeightTracker: React.FC<BodyWeightTrackerProps> = ({ onClose, onSave }) => {
  const [weight, setWeight] = useState<string>('');
  const [history, setHistory] = useState<BodyWeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNumpad, setShowNumpad] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getBodyWeightHistory();
        setHistory(data || []);
        if (data && data.length > 0 && data[0]?.weight) {
          setWeight(data[0].weight.toString());
        }
      } catch (e) {
        console.error('Failed to load weight history:', e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleSave = useCallback(async () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    const newEntry: BodyWeightEntry = {
      id: `bw-${Date.now()}`,
      date: new Date().toISOString(),
      weight: weightNum,
    };

    try {
      await saveBodyWeight(newEntry);
      if ('vibrate' in navigator) navigator.vibrate(50);
      onSave(weightNum);
      onClose();
    } catch (e) {
      console.error('Failed to save weight:', e);
    }
  }, [weight, onSave, onClose]);

  // Numpad input handler
  const handleNumpadInput = useCallback((value: string) => {
    if ('vibrate' in navigator) navigator.vibrate(20);

    if (value === 'delete') {
      setWeight(prev => prev.slice(0, -1));
    } else if (value === 'done') {
      setShowNumpad(false);
    } else if (value === '.') {
      if (!weight.includes('.')) {
        setWeight(prev => prev + '.');
      }
    } else {
      // Limit to reasonable weight input
      if (weight.length < 5) {
        setWeight(prev => prev + value);
      }
    }
  }, [weight]);

  // Calculate weight change
  const weightChange = history.length >= 2
    ? (parseFloat(weight) || history[0]?.weight || 0) - (history[1]?.weight || 0)
    : null;

  // Sparkline rendering with proper line path
  const renderSparkline = useCallback(() => {
    if (history.length < 2) return null;

    const data = history.slice(0, 14).reverse(); // Last 14 entries, oldest first
    const min = Math.min(...data.map(d => d.weight));
    const max = Math.max(...data.map(d => d.weight));
    const range = max - min || 1;

    const width = 280;
    const height = 80;
    const padding = 10;

    // Create path with proper line segments
    const pathPoints = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.weight - min) / range) * (height - padding * 2);
      return { x, y, weight: d.weight };
    });

    const linePath = pathPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
      .join(' ');

    // Area fill path
    const areaPath = `${linePath} L ${pathPoints[pathPoints.length - 1].x},${height} L ${pathPoints[0].x},${height} Z`;

    return (
      <svg
        width="100%"
        height="100px"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cosmos-accent-cyan)" />
            <stop offset="100%" stopColor="var(--cosmos-accent-primary)" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cosmos-accent-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--cosmos-accent-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area Fill */}
        <motion.path
          d={areaPath}
          fill="url(#areaGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Line Path */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Data Points */}
        {pathPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === pathPoints.length - 1 ? 5 : 3}
            fill={i === pathPoints.length - 1 ? 'var(--cosmos-accent-cyan)' : '#fff'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
          />
        ))}
      </svg>
    );
  }, [history]);

  return (
    <motion.div
      className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-[#0f0f13] border border-white/10 p-6 space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-1">⚖️ משקל גוף</h2>
          <p className="text-white/50 text-sm">מעקב יומי לאיסוף נתונים</p>
        </div>

        {/* Sparkline Chart */}
        <div className="h-[100px] flex items-center justify-center">
          {loading ? (
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-white/10 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : history.length < 2 ? (
            <p className="text-white/30 text-sm">לא נמצא היסטוריה מספיקה להצגת גרף</p>
          ) : (
            renderSparkline()
          )}
        </div>

        {/* Weight Input */}
        <div className="text-center">
          <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
            משקל נוכחי (ק״ג)
          </label>
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNumpad(!showNumpad)}
            className={`inline-flex items-baseline gap-2 px-8 py-4 rounded-2xl cursor-pointer transition-all border-2 ${showNumpad
                ? 'bg-[var(--cosmos-accent-primary)]/10 border-[var(--cosmos-accent-primary)]'
                : 'bg-white/5 border-transparent hover:border-white/20'
              }`}
          >
            <span className="text-5xl font-black tabular-nums text-white">
              {weight || '0'}
            </span>
            <span className="text-xl text-white/50">ק״ג</span>
          </motion.div>

          {/* Weight Change Indicator */}
          {weightChange !== null && !isNaN(weightChange) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-2 text-sm font-semibold ${weightChange > 0 ? 'text-orange-400' : weightChange < 0 ? 'text-green-400' : 'text-white/50'
                }`}
            >
              {weightChange > 0 ? '↑' : weightChange < 0 ? '↓' : '='}
              {' '}{Math.abs(weightChange).toFixed(1)} ק״ג מהמדידה הקודמת
            </motion.div>
          )}
        </div>

        {/* Numpad */}
        <AnimatePresence>
          {showNumpad && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map(key => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumpadInput(key)}
                    className={`h-14 min-h-[56px] rounded-xl font-bold text-xl transition-all ${key === 'delete'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/10 text-white border border-white/10 active:bg-white/20'
                      }`}
                  >
                    {key === 'delete' ? '⌫' : key}
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNumpad(false)}
                className="w-full h-12 mt-2 rounded-xl bg-[var(--cosmos-accent-primary)] text-black font-bold"
              >
                ✓ אישור
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 h-14 min-h-[56px] rounded-2xl bg-white/5 border border-white/20 text-white/70 font-bold hover:bg-white/10 transition-all"
          >
            דלג
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!weight || parseFloat(weight) <= 0}
            className="flex-1 h-14 min-h-[56px] rounded-2xl bg-[var(--cosmos-accent-primary)] text-black font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            שמור
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BodyWeightTracker;
