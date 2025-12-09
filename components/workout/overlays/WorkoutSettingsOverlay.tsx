// WorkoutSettingsOverlay - COMPLETE Premium Settings with ALL features from old component
// 100% Android mobile optimized with 48px+ touch targets

import { useState, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { CloseIcon, SettingsIcon } from '../../icons';
import { WORKOUT_THEMES, getThemeVariables } from '../themes';
import ExerciseLibraryTab from '../ExerciseLibraryTab';
import PRHistoryTab from '../PRHistoryTab';
import AnalyticsDashboard from '../AnalyticsDashboard';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface WorkoutSettingsOverlayProps {
    isOpen: boolean;
    settings: WorkoutSettingsData;
    onClose: () => void;
    onUpdateSetting: (key: string, value: unknown) => void;
}

interface WorkoutSettingsData {
    defaultRestTime?: number;
    defaultWorkoutGoal?: string;
    selectedTheme?: string;
    oledMode?: boolean;
    keepAwake?: boolean;
    hapticsEnabled?: boolean;
    showGhostValues?: boolean;
    autoStartRest?: boolean;
    warmupPreference?: 'always' | 'ask' | 'never';
    cooldownPreference?: 'always' | 'ask' | 'never';
    workoutRemindersEnabled?: boolean;
    reminderTime?: string;
    waterReminderInterval?: number;
}

type SettingsTab = 'general' | 'display' | 'timers' | 'warmup' | 'library' | 'records' | 'analytics';

// ============================================================
// HAPTIC
// ============================================================

const triggerHaptic = (pattern: number[] = [15]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

// ============================================================
// PREMIUM TOGGLE
// ============================================================

interface ToggleProps {
    label: string;
    description?: string;
    value: boolean;
    onChange: (v: boolean) => void;
    accentColor?: string;
}

const Toggle = memo<ToggleProps>(({ label, description, value, onChange, accentColor = 'var(--cosmos-accent-primary)' }) => (
    <button
        type="button"
        onClick={() => {
            triggerHaptic();
            onChange(!value);
        }}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] active:bg-white/[0.08] transition-all min-h-[72px] text-right"
    >
        <div className="flex-1 ml-4">
            <div className="font-semibold text-white text-[15px] leading-tight">{label}</div>
            {description && <div className="text-[12px] text-white/40 mt-1 leading-snug">{description}</div>}
        </div>
        <div
            className="relative w-[52px] h-[32px] rounded-full transition-all duration-300 flex-shrink-0"
            style={{
                background: value ? accentColor : 'rgba(255,255,255,0.15)',
                boxShadow: value ? `0 0 20px ${accentColor}50` : 'none'
            }}
        >
            <motion.div
                className="absolute top-[4px] w-[24px] h-[24px] rounded-full bg-white shadow-lg"
                animate={{ left: value ? '24px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </div>
    </button>
));
Toggle.displayName = 'Toggle';

// ============================================================
// SEGMENTED CONTROL (For Warmup/Cooldown)
// ============================================================

interface SegmentedControlProps {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    accentColor?: string;
}

const SegmentedControl = memo<SegmentedControlProps>(({ label, options, value, onChange, accentColor = 'var(--cosmos-accent-primary)' }) => (
    <div className="space-y-3">
        <div className="text-[13px] font-semibold text-white/60">{label}</div>
        <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            {options.map(opt => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                            triggerHaptic();
                            onChange(opt.value);
                        }}
                        className={`
              flex-1 py-3 px-2 rounded-xl font-semibold text-[13px] transition-all min-h-[48px]
              ${isActive ? 'text-white shadow-lg' : 'text-white/50 hover:text-white/70'}
            `}
                        style={isActive ? {
                            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}90 100%)`,
                            boxShadow: `0 4px 20px ${accentColor}40`
                        } : {}}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    </div>
));
SegmentedControl.displayName = 'SegmentedControl';

// ============================================================
// GOAL SELECTOR
// ============================================================

interface GoalSelectorProps {
    value: string;
    onChange: (goal: string) => void;
}

const goals = [
    { id: 'strength', label: 'כוח', emoji: '💪', color: '#ef4444' },
    { id: 'hypertrophy', label: 'נפח', emoji: '🏋️', color: '#f97316' },
    { id: 'endurance', label: 'סיבולת', emoji: '🏃', color: '#22c55e' },
    { id: 'flexibility', label: 'גמישות', emoji: '🧘', color: '#06b6d4' },
    { id: 'general', label: 'כללי', emoji: '⚡', color: '#6366f1' },
];

const GoalSelector = memo<GoalSelectorProps>(({ value, onChange }) => (
    <div className="space-y-3">
        <div className="text-[13px] font-semibold text-white/60">מטרת האימון</div>
        <div className="grid grid-cols-2 gap-2">
            {goals.map(goal => {
                const isActive = value === goal.id;
                return (
                    <motion.button
                        key={goal.id}
                        type="button"
                        onClick={() => {
                            triggerHaptic([15, 30, 15]);
                            onChange(goal.id);
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`
              flex items-center gap-3 p-4 rounded-2xl border-2 transition-all min-h-[64px]
              ${isActive
                                ? 'border-white/30 shadow-lg'
                                : 'border-white/[0.08] hover:border-white/20'
                            }
            `}
                        style={isActive ? {
                            background: `linear-gradient(135deg, ${goal.color}30 0%, ${goal.color}10 100%)`,
                            boxShadow: `0 0 30px ${goal.color}30`
                        } : {
                            background: 'rgba(255,255,255,0.03)'
                        }}
                    >
                        <span className="text-2xl">{goal.emoji}</span>
                        <span className={`font-bold text-[15px] ${isActive ? 'text-white' : 'text-white/70'}`}>
                            {goal.label}
                        </span>
                        {isActive && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mr-auto w-6 h-6 rounded-full bg-white flex items-center justify-center text-black font-bold text-xs"
                            >
                                ✓
                            </motion.div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    </div>
));
GoalSelector.displayName = 'GoalSelector';

// ============================================================
// THEME SELECTOR (All 8 Themes)
// ============================================================

interface ThemeSelectorProps {
    value: string;
    onChange: (themeId: string) => void;
}

const ThemeSelector = memo<ThemeSelectorProps>(({ value, onChange }) => {
    const themes = Object.values(WORKOUT_THEMES);

    return (
        <div className="space-y-3">
            <div className="text-[13px] font-semibold text-white/60">ערכת נושא</div>
            <div className="grid grid-cols-2 gap-3">
                {themes.map(theme => {
                    const isActive = value === theme.id;
                    return (
                        <motion.button
                            key={theme.id}
                            type="button"
                            onClick={() => {
                                triggerHaptic([15, 30, 15]);
                                onChange(theme.id);
                                // Apply theme immediately for preview
                                const vars = getThemeVariables(theme.id);
                                Object.entries(vars).forEach(([key, val]) => {
                                    document.documentElement.style.setProperty(key, val);
                                });
                            }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                relative p-4 rounded-2xl border-2 transition-all min-h-[100px] overflow-hidden
                ${isActive
                                    ? 'border-white/40 shadow-lg'
                                    : 'border-white/[0.08] hover:border-white/20'
                                }
              `}
                            style={{
                                background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.primary}20 100%)`
                            }}
                        >
                            {/* Color dots */}
                            <div className="flex gap-2 mb-3">
                                <div
                                    className="w-6 h-6 rounded-full shadow-lg"
                                    style={{
                                        background: theme.colors.primary,
                                        boxShadow: `0 0 12px ${theme.colors.primary}60`
                                    }}
                                />
                                <div
                                    className="w-6 h-6 rounded-full shadow-lg"
                                    style={{
                                        background: theme.colors.secondary,
                                        boxShadow: `0 0 12px ${theme.colors.secondary}60`
                                    }}
                                />
                                <div
                                    className="w-6 h-6 rounded-full shadow-lg"
                                    style={{
                                        background: theme.colors.accent,
                                        boxShadow: `0 0 12px ${theme.colors.accent}60`
                                    }}
                                />
                            </div>

                            <div className={`font-bold text-[13px] text-right ${isActive ? 'text-white' : 'text-white/70'}`}>
                                {theme.name}
                            </div>

                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white flex items-center justify-center text-black font-bold text-sm shadow-lg"
                                >
                                    ✓
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
});
ThemeSelector.displayName = 'ThemeSelector';

// ============================================================
// REST TIME SELECTOR
// ============================================================

interface RestTimeSelectorProps {
    value: number;
    onChange: (time: number) => void;
}

const restTimeOptions = [30, 60, 90, 120, 180, 240];

const RestTimeSelector = memo<RestTimeSelectorProps>(({ value, onChange }) => (
    <div className="space-y-3">
        <div className="text-[13px] font-semibold text-white/60">זמן מנוחה ברירת מחדל</div>
        <div className="grid grid-cols-3 gap-2">
            {restTimeOptions.map(time => {
                const isActive = value === time;
                const minutes = Math.floor(time / 60);
                const seconds = time % 60;
                const label = minutes > 0
                    ? (seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}:00`)
                    : `${time}s`;

                return (
                    <motion.button
                        key={time}
                        type="button"
                        onClick={() => {
                            triggerHaptic();
                            onChange(time);
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`
              py-4 rounded-2xl font-bold text-[15px] transition-all min-h-[56px]
              ${isActive
                                ? 'text-white shadow-lg'
                                : 'text-white/50 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06]'
                            }
            `}
                        style={isActive ? {
                            background: 'linear-gradient(135deg, var(--cosmos-accent-primary) 0%, var(--cosmos-accent-cyan) 100%)',
                            boxShadow: '0 4px 25px rgba(99, 102, 241, 0.4)'
                        } : {}}
                    >
                        {label}
                    </motion.button>
                );
            })}
        </div>
    </div>
));
RestTimeSelector.displayName = 'RestTimeSelector';

// ============================================================
// TAB BUTTON
// ============================================================

interface TabButtonProps {
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton = memo<TabButtonProps>(({ label, icon, isActive, onClick }) => (
    <button
        type="button"
        onClick={() => {
            triggerHaptic();
            onClick();
        }}
        className={`
      flex-shrink-0 flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl transition-all min-w-[70px]
      ${isActive
                ? 'bg-[var(--cosmos-accent-primary)]/20 text-[var(--cosmos-accent-primary)]'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }
    `}
    >
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] font-semibold whitespace-nowrap">{label}</span>
    </button>
));
TabButton.displayName = 'TabButton';

// ============================================================
// MAIN COMPONENT
// ============================================================

const WorkoutSettingsOverlay = memo<WorkoutSettingsOverlayProps>(({
    isOpen,
    settings,
    onClose,
    onUpdateSetting,
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const y = useMotionValue(0);
    const backdropOpacity = useTransform(y, [0, 200], [1, 0]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y > 100) {
            onClose();
        }
    };

    const handleClose = useCallback(() => {
        triggerHaptic();
        onClose();
    }, [onClose]);

    // Reset tab when opening
    useEffect(() => {
        if (isOpen) {
            setActiveTab('general');
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex flex-col"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                        style={{ opacity: backdropOpacity }}
                        onClick={handleClose}
                    />

                    {/* Mesh gradients */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[var(--cosmos-accent-primary)]/15 blur-[100px]" />
                        <div className="absolute -bottom-[20%] -left-[20%] w-[50%] h-[50%] rounded-full bg-[var(--cosmos-accent-cyan)]/10 blur-[80px]" />
                    </div>

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        style={{
                            y,
                            background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(10,10,18,0.99) 100%)',
                            boxShadow: '0 -20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                        }}
                        className="relative flex-1 flex flex-col mt-12 rounded-t-[32px] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center py-3 flex-shrink-0">
                            <div className="w-12 h-1.5 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="px-5 pb-4 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--cosmos-accent-primary)]/30 to-[var(--cosmos-accent-cyan)]/20 flex items-center justify-center border border-white/10 shadow-lg">
                                    <SettingsIcon className="w-6 h-6 text-[var(--cosmos-accent-primary)]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">הגדרות</h2>
                                    <p className="text-[11px] text-white/40">התאמה אישית לאימון</p>
                                </div>
                            </div>
                            <motion.button
                                type="button"
                                onClick={handleClose}
                                whileTap={{ scale: 0.9 }}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </motion.button>
                        </div>

                        {/* Scrollable Tabs */}
                        <div className="px-4 pb-3 flex-shrink-0 overflow-hidden">
                            <div className="flex gap-1 overflow-x-auto pb-2 hide-scrollbar">
                                <TabButton icon="" label="כללי" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                                <TabButton icon="" label="תצוגה" isActive={activeTab === 'display'} onClick={() => setActiveTab('display')} />
                                <TabButton icon="" label="טיימרים" isActive={activeTab === 'timers'} onClick={() => setActiveTab('timers')} />
                                <TabButton icon="" label="חימום" isActive={activeTab === 'warmup'} onClick={() => setActiveTab('warmup')} />
                                <TabButton icon="" label="ספריה" isActive={activeTab === 'library'} onClick={() => setActiveTab('library')} />
                                <TabButton icon="" label="שיאים" isActive={activeTab === 'records'} onClick={() => setActiveTab('records')} />
                                <TabButton icon="" label="סטטיסטיקות" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[env(safe-area-inset-bottom,24px)]">
                            <AnimatePresence mode="wait">
                                {/* General Tab */}
                                {activeTab === 'general' && (
                                    <motion.div
                                        key="general"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-5 pb-6"
                                    >
                                        <GoalSelector
                                            value={settings.defaultWorkoutGoal || 'general'}
                                            onChange={v => onUpdateSetting('defaultWorkoutGoal', v)}
                                        />

                                        <div className="h-px bg-white/[0.06]" />

                                        <div className="space-y-3">
                                            <div className="text-[13px] font-semibold text-white/60">העדפות</div>
                                            <Toggle
                                                label="רטט (Haptic)"
                                                description="משוב רטט בלחיצות ובסיום סטים"
                                                value={settings.hapticsEnabled ?? true}
                                                onChange={v => onUpdateSetting('hapticsEnabled', v)}
                                            />
                                            <Toggle
                                                label="שמור מסך דלוק"
                                                description="מניעת כיבוי מסך אוטומטי בזמן אימון"
                                                value={settings.keepAwake ?? true}
                                                onChange={v => onUpdateSetting('keepAwake', v)}
                                            />
                                            <Toggle
                                                label="ערכים מאימון קודם"
                                                description="הצג משקל וחזרות מהאימון האחרון"
                                                value={settings.showGhostValues ?? true}
                                                onChange={v => onUpdateSetting('showGhostValues', v)}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Display Tab */}
                                {activeTab === 'display' && (
                                    <motion.div
                                        key="display"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-5 pb-6"
                                    >
                                        <ThemeSelector
                                            value={settings.selectedTheme || 'deepCosmos'}
                                            onChange={v => onUpdateSetting('selectedTheme', v)}
                                        />

                                        <div className="h-px bg-white/[0.06]" />

                                        <Toggle
                                            label="מצב OLED"
                                            description="רקע שחור מוחלט לחיסכון בסוללה במסכי AMOLED"
                                            value={settings.oledMode ?? false}
                                            onChange={v => onUpdateSetting('oledMode', v)}
                                        />
                                    </motion.div>
                                )}

                                {/* Timers Tab */}
                                {activeTab === 'timers' && (
                                    <motion.div
                                        key="timers"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-5 pb-6"
                                    >
                                        <RestTimeSelector
                                            value={settings.defaultRestTime ?? 90}
                                            onChange={v => onUpdateSetting('defaultRestTime', v)}
                                        />

                                        <div className="h-px bg-white/[0.06]" />

                                        <Toggle
                                            label="טיימר אוטומטי"
                                            description="התחל טיימר מנוחה אוטומטית אחרי סיום סט"
                                            value={settings.autoStartRest ?? true}
                                            onChange={v => onUpdateSetting('autoStartRest', v)}
                                        />
                                    </motion.div>
                                )}

                                {/* Warmup/Cooldown Tab */}
                                {activeTab === 'warmup' && (
                                    <motion.div
                                        key="warmup"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-5 pb-6"
                                    >
                                        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                                            <p className="text-[13px] text-white/70 leading-relaxed">
                                                חימום וצינון עוזרים למנוע פציעות ולשפר ביצועים. בחר מתי להציג את ההנחיות.
                                            </p>
                                        </div>

                                        <SegmentedControl
                                            label="🔥 חימום"
                                            options={[
                                                { value: 'always', label: 'תמיד' },
                                                { value: 'ask', label: 'שאל' },
                                                { value: 'never', label: 'לעולם לא' },
                                            ]}
                                            value={settings.warmupPreference || 'ask'}
                                            onChange={v => onUpdateSetting('warmupPreference', v)}
                                            accentColor="#f97316"
                                        />

                                        <SegmentedControl
                                            label="❄️ צינון"
                                            options={[
                                                { value: 'always', label: 'תמיד' },
                                                { value: 'ask', label: 'שאל' },
                                                { value: 'never', label: 'לעולם לא' },
                                            ]}
                                            value={settings.cooldownPreference || 'ask'}
                                            onChange={v => onUpdateSetting('cooldownPreference', v)}
                                            accentColor="#06b6d4"
                                        />

                                        <div className="h-px bg-white/[0.06]" />

                                        <Toggle
                                            label="תזכורת לשתות מים"
                                            description="תזכורת כל 15 דקות לשתות מים"
                                            value={settings.workoutRemindersEnabled ?? false}
                                            onChange={v => onUpdateSetting('workoutRemindersEnabled', v)}
                                            accentColor="#22c55e"
                                        />
                                    </motion.div>
                                )}

                                {/* Library Tab */}
                                {activeTab === 'library' && (
                                    <motion.div
                                        key="library"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="pb-6"
                                    >
                                        <ExerciseLibraryTab />
                                    </motion.div>
                                )}

                                {/* Records Tab */}
                                {activeTab === 'records' && (
                                    <motion.div
                                        key="records"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="pb-6"
                                    >
                                        <PRHistoryTab />
                                    </motion.div>
                                )}

                                {/* Analytics Tab */}
                                {activeTab === 'analytics' && (
                                    <motion.div
                                        key="analytics"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="pb-6"
                                    >
                                        <AnalyticsDashboard />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Styles */}
                    <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

WorkoutSettingsOverlay.displayName = 'WorkoutSettingsOverlay';

export default WorkoutSettingsOverlay;
