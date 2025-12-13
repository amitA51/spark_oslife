import React from 'react';
import {
    BellIcon,
    SunIcon,
    MoonIcon,
    ClockIcon,
    CheckCircleIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
    SettingsSection,
    SettingsGroupCard,
    SettingsRow,
    SegmentedControl,
} from './SettingsComponents';

const DAYS_OF_WEEK = [
    { label: 'ראשון', value: 0 },
    { label: 'שני', value: 1 },
    { label: 'שלישי', value: 2 },
    { label: 'רביעי', value: 3 },
    { label: 'חמישי', value: 4 },
    { label: 'שישי', value: 5 },
    { label: 'שבת', value: 6 },
];

const NotificationsSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    return (
        <SettingsSection title="התראות וסיכומים" id="notifications">
            {/* Daily Digest */}
            <SettingsGroupCard title="סיכום יומי" icon={<BellIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="סיכום יומי"
                    description="קבל סיכום של המשימות והאירועים בסוף היום."
                    icon={<SunIcon className="w-4 h-4" />}
                >
                    <ToggleSwitch
                        checked={settings.dailyDigestEnabled}
                        onChange={v => updateSettings({ dailyDigestEnabled: v })}
                    />
                </SettingsRow>
                {settings.dailyDigestEnabled && (
                    <SettingsRow
                        title="שעת סיכום"
                        description="באיזו שעה לשלוח את הסיכום היומי."
                    >
                        <input
                            type="time"
                            value={settings.dailyDigestTime}
                            onChange={e => updateSettings({ dailyDigestTime: e.target.value })}
                            className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:border-[var(--dynamic-accent-start)] outline-none"
                        />
                    </SettingsRow>
                )}
            </SettingsGroupCard>

            {/* Weekly Review */}
            <SettingsGroupCard title="סקירה שבועית" icon={<ClockIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="סקירה שבועית"
                    description="קבל סיכום שבועי של ההתקדמות שלך."
                >
                    <ToggleSwitch
                        checked={settings.weeklyReviewEnabled}
                        onChange={v => updateSettings({ weeklyReviewEnabled: v })}
                    />
                </SettingsRow>
                {settings.weeklyReviewEnabled && (
                    <SettingsRow
                        title="יום הסקירה"
                        description="באיזה יום לשלוח את הסקירה השבועית."
                    >
                        <select
                            value={settings.weeklyReviewDay}
                            onChange={e => updateSettings({ weeklyReviewDay: parseInt(e.target.value) })}
                            className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--dynamic-accent-start)] transition-all cursor-pointer"
                        >
                            {DAYS_OF_WEEK.map(day => (
                                <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                        </select>
                    </SettingsRow>
                )}
            </SettingsGroupCard>

            {/* Quiet Hours */}
            <SettingsGroupCard title="שעות שקט" icon={<MoonIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="מצב אל תפריע"
                    description="השתק התראות בזמנים מסוימים."
                >
                    <ToggleSwitch
                        checked={settings.quietHoursEnabled}
                        onChange={v => updateSettings({ quietHoursEnabled: v })}
                    />
                </SettingsRow>
                {settings.quietHoursEnabled && (
                    <>
                        <SettingsRow title="התחלה" description="שעת תחילת השקט.">
                            <input
                                type="time"
                                value={settings.quietHoursStart}
                                onChange={e => updateSettings({ quietHoursStart: e.target.value })}
                                className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:border-[var(--dynamic-accent-start)] outline-none"
                            />
                        </SettingsRow>
                        <SettingsRow title="סיום" description="שעת סיום השקט.">
                            <input
                                type="time"
                                value={settings.quietHoursEnd}
                                onChange={e => updateSettings({ quietHoursEnd: e.target.value })}
                                className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:border-[var(--dynamic-accent-start)] outline-none"
                            />
                        </SettingsRow>
                    </>
                )}
            </SettingsGroupCard>

            {/* Celebration & Reminders */}
            <SettingsGroupCard title="תזכורות" icon={<CheckCircleIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="חגיגה בהשלמה"
                    description="הצג אנימציית חגיגה כשאתה משלים משימה."
                >
                    <ToggleSwitch
                        checked={settings.celebrateCompletions}
                        onChange={v => updateSettings({ celebrateCompletions: v })}
                    />
                </SettingsRow>
                <SettingsRow
                    title="תזכורות משימות"
                    description="קבל התראה לפני יעד משימה."
                >
                    <ToggleSwitch
                        checked={settings.taskRemindersEnabled}
                        onChange={v => updateSettings({ taskRemindersEnabled: v })}
                    />
                </SettingsRow>
                {settings.taskRemindersEnabled && (
                    <SettingsRow
                        title="זמן תזכורת"
                        description="כמה דקות לפני היעד."
                    >
                        <SegmentedControl
                            value={settings.taskReminderTime.toString()}
                            onChange={v => updateSettings({ taskReminderTime: parseInt(v) as 5 | 15 | 30 | 60 })}
                            options={[
                                { label: '5 דק׳', value: '5' },
                                { label: '15 דק׳', value: '15' },
                                { label: '30 דק׳', value: '30' },
                                { label: 'שעה', value: '60' },
                            ]}
                        />
                    </SettingsRow>
                )}
                <SettingsRow
                    title="תזכורות הרגלים"
                    description="קבל תזכורות יומיות להרגלים שלך."
                >
                    <ToggleSwitch
                        checked={settings.enableHabitReminders}
                        onChange={v => updateSettings({ enableHabitReminders: v })}
                    />
                </SettingsRow>
            </SettingsGroupCard>
        </SettingsSection>
    );
};

export default NotificationsSection;


