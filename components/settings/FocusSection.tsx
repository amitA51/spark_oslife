import React, { useState } from 'react';
import {
    TimerIcon,
    TargetIcon,
    TrendingUpIcon,
    VolumeIcon,
    PlayIcon,
    RefreshIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useFocusSession } from '../../src/contexts/FocusContext';
import {
    SettingsSection,
    SettingsCard,
    SettingsRow,
    SettingsInfoBanner,
} from './SettingsComponents';

// ============================================================================
// Focus & Pomodoro Settings Section
// ============================================================================

const FocusSection: React.FC = () => {
    const {
        settings,
        updateSettings,
        stats,
        streak,
        dailyGoal,
        setDailyGoal,
        clearHistory,
        pomodorosCompleted,
    } = useFocusSession();

    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Helpers
    const formatDuration = (ms: number): string => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        if (hours > 0) {
            return `${hours} שעות ${minutes} דקות`;
        }
        return `${minutes} דקות`;
    };

    const handleClearHistory = () => {
        clearHistory();
        setShowClearConfirm(false);
    };

    return (
        <SettingsSection title="פוקוס ופומודורו" id="focus">
            {/* Current Stats Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[var(--dynamic-accent-start)]/10 to-[var(--dynamic-accent-end)]/10 border border-[var(--dynamic-accent-start)]/20">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                        הסטטיסטיקות שלך
                    </h3>
                    <span className="text-sm text-[var(--text-secondary)]">
                        🔥 {streak.currentStreak} ימים ברצף
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.05] text-center">
                        <div className="text-2xl font-bold text-white">{pomodorosCompleted}</div>
                        <div className="text-xs text-[var(--text-secondary)]">פומודורו היום</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.05] text-center">
                        <div className="text-2xl font-bold text-white">{formatDuration(stats.todayFocusTime)}</div>
                        <div className="text-xs text-[var(--text-secondary)]">זמן פוקוס היום</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.05] text-center">
                        <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
                        <div className="text-xs text-[var(--text-secondary)]">סה"כ סשנים</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.05] text-center">
                        <div className="text-2xl font-bold text-white">{streak.longestStreak}</div>
                        <div className="text-xs text-[var(--text-secondary)]">רצף שיא</div>
                    </div>
                </div>

                {/* Daily Goal Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--text-secondary)]">יעד יומי</span>
                        <span className="text-white font-medium">
                            {dailyGoal.completedMinutes} / {dailyGoal.targetMinutes} דקות
                        </span>
                    </div>
                    <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (dailyGoal.completedMinutes / dailyGoal.targetMinutes) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Timer Durations */}
            <SettingsCard title="משכי זמן" icon={<TimerIcon className="w-5 h-5" />}>
                <SettingsRow title="זמן עבודה (דקות)" description="משך סשן עבודה רגיל במצב פוקוס.">
                    <input
                        type="number"
                        min={1}
                        max={120}
                        value={settings.focusDuration}
                        onChange={e => updateSettings({ focusDuration: parseInt(e.target.value) || 25 })}
                        className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-xl p-2.5 text-center text-white focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 outline-none transition-all"
                    />
                </SettingsRow>

                <SettingsRow title="הפסקה קצרה (דקות)" description="משך הפסקה בין סשני עבודה.">
                    <input
                        type="number"
                        min={1}
                        max={30}
                        value={settings.shortBreakDuration}
                        onChange={e => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })}
                        className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-xl p-2.5 text-center text-white focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 outline-none transition-all"
                    />
                </SettingsRow>

                <SettingsRow title="הפסקה ארוכה (דקות)" description="הפסקה גדולה אחרי מספר סשנים.">
                    <input
                        type="number"
                        min={5}
                        max={60}
                        value={settings.longBreakDuration}
                        onChange={e => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
                        className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-xl p-2.5 text-center text-white focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 outline-none transition-all"
                    />
                </SettingsRow>

                <SettingsRow title="סשנים עד הפסקה ארוכה" description="כמות סשני עבודה לפני הפסקה ארוכה.">
                    <input
                        type="number"
                        min={2}
                        max={10}
                        value={settings.sessionsUntilLongBreak}
                        onChange={e => updateSettings({ sessionsUntilLongBreak: parseInt(e.target.value) || 4 })}
                        className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-xl p-2.5 text-center text-white focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 outline-none transition-all"
                    />
                </SettingsRow>
            </SettingsCard>

            {/* Automation Settings */}
            <SettingsCard title="אוטומציה" icon={<PlayIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
                <SettingsRow title="התחל הפסקות אוטומטית" description="התחל הפסקה באופן אוטומטי לאחר סיום סשן עבודה.">
                    <ToggleSwitch
                        checked={settings.autoStartBreaks}
                        onChange={(v: boolean) => updateSettings({ autoStartBreaks: v })}
                    />
                </SettingsRow>

                <SettingsRow title="התחל סשן הבא אוטומטית" description="התחל סשן עבודה חדש לאחר סיום הפסקה.">
                    <ToggleSwitch
                        checked={settings.autoStartFocus}
                        onChange={(v: boolean) => updateSettings({ autoStartFocus: v })}
                    />
                </SettingsRow>
            </SettingsCard>

            {/* Sound & Feedback */}
            <SettingsCard title="צלילים ומשוב" icon={<VolumeIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
                <SettingsRow title="אפקטים קוליים" description="השמע צלילים בהתחלה וסיום של סשנים.">
                    <ToggleSwitch
                        checked={settings.enableSounds}
                        onChange={(v: boolean) => updateSettings({ enableSounds: v })}
                    />
                </SettingsRow>

                <SettingsInfoBanner variant="info">
                    💡 הצלילים ישמעו בהתחלת סשן, בסיום עבודה, בהשהייה ובסיום הפסקה.
                </SettingsInfoBanner>
            </SettingsCard>

            {/* Daily Goal */}
            <SettingsCard title="יעד יומי" icon={<TargetIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
                <SettingsRow title="יעד זמן יומי (דקות)" description="הגדר את מטרת הזמן היומית שלך למצב פוקוס.">
                    <input
                        type="number"
                        min={15}
                        max={480}
                        step={15}
                        value={dailyGoal.targetMinutes}
                        onChange={e => setDailyGoal(parseInt(e.target.value) || 120)}
                        className="w-24 bg-white/[0.05] border border-white/[0.1] rounded-xl p-2.5 text-center text-white focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 outline-none transition-all"
                    />
                </SettingsRow>

                {/* Quick presets */}
                <div className="mt-4">
                    <p className="text-xs text-[var(--text-secondary)] mb-2">יעדים מהירים:</p>
                    <div className="flex flex-wrap gap-2">
                        {[60, 90, 120, 180, 240].map(minutes => (
                            <button
                                key={minutes}
                                onClick={() => setDailyGoal(minutes)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${dailyGoal.targetMinutes === minutes
                                        ? 'bg-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)] border border-[var(--dynamic-accent-start)]/30'
                                        : 'bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.1]'
                                    }`}
                            >
                                {minutes >= 60 ? `${minutes / 60} שעות` : `${minutes} דקות`}
                            </button>
                        ))}
                    </div>
                </div>
            </SettingsCard>

            {/* Data Management */}
            <SettingsCard title="ניהול נתונים" icon={<RefreshIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
                <SettingsInfoBanner variant="warning">
                    ⚠️ מחיקת היסטוריית הפוקוס תמחק את כל הסטטיסטיקות, הרצפים והסשנים השמורים.
                </SettingsInfoBanner>

                <div className="mt-4">
                    {!showClearConfirm ? (
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                            מחק היסטוריית פוקוס
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-red-400">אתה בטוח?</span>
                            <button
                                onClick={handleClearHistory}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                                כן, מחק
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/[0.1] text-white hover:bg-white/[0.2] transition-all"
                            >
                                ביטול
                            </button>
                        </div>
                    )}
                </div>
            </SettingsCard>
        </SettingsSection>
    );
};

export default FocusSection;
