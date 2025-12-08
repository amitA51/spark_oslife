import React, { useState, useEffect } from 'react';
import { getWorkoutSessions } from '../../services/dataService';
import {
  calculateVolumeHistory,
  calculateFrequency,
  getAverageVolume,
  VolumeDataPoint,
  FrequencyData,
} from '../../services/analyticsService';
import {
  calculateStreak,
  getAchievements,
  StreakInfo,
  Achievement,
} from '../../services/achievementService';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, FlameIcon } from '../icons';
import './workout-premium.css';

/**
 * Premium Stat Card Component
 */
const StatCard = ({
  icon,
  label,
  value,
  sublabel,
  gradient,
  iconColor,
  delay = 0
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel: string;
  gradient: string;
  iconColor: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    className={`workout-glass-card ${gradient} rounded-2xl p-4 relative overflow-hidden group`}
  >
    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColor}>{icon}</span>
        <span className="text-[10px] text-[var(--cosmos-text-muted)] uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-[10px] text-white/40 mt-1">{sublabel}</div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
  </motion.div>
);

const AnalyticsDashboard: React.FC = () => {
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([]);
  const [avgVolume, setAvgVolume] = useState(0);
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      const sessions = await getWorkoutSessions();

      const volume = calculateVolumeHistory(sessions);
      const frequency = calculateFrequency(sessions, 12);
      const avg = getAverageVolume(sessions, 10);
      const streak = calculateStreak(sessions);
      const achieves = getAchievements(sessions, streak);

      setVolumeData(volume);
      setFrequencyData(frequency);
      setAvgVolume(avg);
      setStreakInfo(streak);
      setAchievements(achieves);
      setLoading(false);
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[var(--cosmos-accent-primary)] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const recentVolume = volumeData.slice(-10);
  const maxVolume = Math.max(...recentVolume.map(d => d.totalVolume), 1);
  const maxFreq = Math.max(...frequencyData.map(d => d.workoutCount), 1);
  const unlockedAchievements = achievements.filter(a => a.progress === 100);

  return (
    <div className="space-y-6 -mr-2 pr-2 overflow-y-auto custom-scrollbar max-h-[60vh]">
      {/* Header Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<span className="text-2xl">🔥</span>}
          label="רצף נוכחי"
          value={streakInfo.currentStreak}
          sublabel="ימים רצופים"
          gradient="bg-gradient-to-br from-orange-500/10 to-red-500/5"
          iconColor="text-orange-400"
          delay={0}
        />
        <StatCard
          icon={<TrophyIcon className="w-5 h-5" />}
          label="הישגים"
          value={`${unlockedAchievements.length}/${achievements.length}`}
          sublabel="פתוחים"
          gradient="bg-gradient-to-br from-purple-500/10 to-pink-500/5"
          iconColor="text-purple-400"
          delay={0.05}
        />
      </div>

      {/* Achievements Grid */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="workout-glass-card rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full workout-pulse-glow" />
            הישגים
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {achievements.slice(0, 6).map((achievement, i) => {
              const isUnlocked = achievement.progress === 100;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`p-3 rounded-xl border transition-all ${isUnlocked
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                >
                  <div className={`text-2xl mb-1 ${isUnlocked ? 'workout-fire-effect' : 'opacity-30 grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div
                    className={`text-xs font-bold ${isUnlocked ? 'text-yellow-300' : 'text-white/60'}`}
                  >
                    {achievement.name}
                  </div>
                  {!isUnlocked && (
                    <div className="mt-2">
                      <div className="bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)]"
                        />
                      </div>
                      <div className="text-[9px] text-white/30 mt-1">{achievement.progress}%</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Stats Cards Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<FlameIcon className="w-5 h-5" />}
          label="נפח ממוצע"
          value={avgVolume.toLocaleString()}
          sublabel="ק״ג לאימון"
          gradient="bg-gradient-to-br from-[var(--cosmos-accent-primary)]/10 to-[var(--cosmos-accent-primary)]/5"
          iconColor="text-[var(--cosmos-accent-primary)]"
          delay={0.15}
        />
        <StatCard
          icon={<TrophyIcon className="w-5 h-5" />}
          label="סה״כ אימונים"
          value={volumeData.length}
          sublabel="אימונים הושלמו"
          gradient="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5"
          iconColor="text-cyan-400"
          delay={0.2}
        />
      </div>

      {/* Premium Volume Chart */}
      {recentVolume.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="workout-glass-card rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--cosmos-accent-primary)] rounded-full" />
            מגמת נפח (10 אימונים אחרונים)
          </h3>

          <div className="h-40 flex items-end justify-between gap-1.5 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="border-t border-dashed border-white/5 w-full" />
              ))}
            </div>

            {recentVolume.map((point, i) => {
              const height = (point.totalVolume / maxVolume) * 100;
              const isHovered = hoveredBar === i;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className={`flex-1 rounded-t-lg min-w-[12px] relative transition-all duration-200 cursor-pointer ${isHovered ? 'brightness-125' : ''
                    }`}
                  style={{
                    background: `linear-gradient(to top, var(--cosmos-accent-primary), var(--cosmos-accent-cyan))`
                  }}
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 rounded-t-lg bg-gradient-to-t from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] blur-md transition-opacity ${isHovered ? 'opacity-50' : 'opacity-0'}`} />

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20"
                      >
                        <div className="bg-black/95 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-white/10">
                          <div className="font-bold">{point.totalVolume.toLocaleString()} ק״ג</div>
                          <div className="text-white/50 text-[8px]">{point.date}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-between text-[9px] text-white/30">
            <span>עבר</span>
            <span>אחרון</span>
          </div>
        </motion.div>
      )}

      {/* Premium Frequency Heatmap */}
      {frequencyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="workout-glass-card rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            תדירות אימונים (12 שבועות)
          </h3>

          <div className="grid grid-cols-12 gap-2">
            {frequencyData.map((week, i) => {
              const intensity = week.workoutCount / maxFreq;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.02, type: 'spring' }}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                  className="aspect-square rounded-lg relative group cursor-pointer transition-transform"
                  style={{
                    background: intensity === 0
                      ? 'rgba(255,255,255,0.05)'
                      : `rgba(34, 211, 238, ${0.2 + intensity * 0.8})`,
                    boxShadow: intensity > 0.5 ? `0 0 ${intensity * 15}px rgba(34, 211, 238, 0.3)` : 'none'
                  }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <div className="bg-black/95 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg border border-white/10">
                      {week.workoutCount} אימונים
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 text-[9px] text-white/40">
            <span>פחות</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.2 }}
                  className="w-4 h-4 rounded"
                  style={{
                    background: intensity === 0
                      ? 'rgba(255,255,255,0.05)'
                      : `rgba(34, 211, 238, ${0.2 + intensity * 0.8})`
                  }}
                />
              ))}
            </div>
            <span>יותר</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;

