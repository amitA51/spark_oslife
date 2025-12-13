import React from 'react';
import {
    CalendarIcon,
    ClockIcon,
    SettingsIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
    SettingsSection,
    SettingsGroupCard,
    SettingsRow,
    SegmentedControl,
} from './SettingsComponents';

const CalendarSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const handleCalendarSettingChange = <K extends keyof typeof settings.calendarSettings>(
        key: K,
        value: (typeof settings.calendarSettings)[K]
    ) => {
        updateSettings({
            calendarSettings: {
                ...settings.calendarSettings,
                [key]: value,
            },
        });
    };

    return (
        <SettingsSection title="לוח שנה וזמן" id="calendar">
            {/* Week & Date Format */}
            <SettingsGroupCard title="פורמט תאריכים" icon={<CalendarIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="יום תחילת שבוע"
                    description="באיזה יום מתחיל השבוע בלוח השנה."
                >
                    <SegmentedControl
                        value={settings.calendarSettings.weekStartsOn.toString()}
                        onChange={v => handleCalendarSettingChange('weekStartsOn', parseInt(v) as 0 | 1 | 6)}
                        options={[
                            { label: 'ראשון', value: '0' },
                            { label: 'שני', value: '1' },
                            { label: 'שבת', value: '6' },
                        ]}
                    />
                </SettingsRow>
                <SettingsRow
                    title="פורמט שעון"
                    description="תצוגת שעות 12 או 24."
                >
                    <SegmentedControl
                        value={settings.calendarSettings.timeFormat}
                        onChange={v => handleCalendarSettingChange('timeFormat', v as '12h' | '24h')}
                        options={[
                            { label: '24 שעות', value: '24h' },
                            { label: '12 שעות', value: '12h' },
                        ]}
                    />
                </SettingsRow>
                <SettingsRow
                    title="פורמט תאריך"
                    description="סדר הצגת התאריך."
                >
                    <select
                        value={settings.calendarSettings.dateFormat}
                        onChange={e => handleCalendarSettingChange('dateFormat', e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD')}
                        className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--dynamic-accent-start)] transition-all cursor-pointer"
                    >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    </select>
                </SettingsRow>
                <SettingsRow
                    title="הצג מספרי שבוע"
                    description="הצג את מספר השבוע בשנה בלוח השנה."
                >
                    <ToggleSwitch
                        checked={settings.calendarSettings.showWeekNumbers}
                        onChange={v => handleCalendarSettingChange('showWeekNumbers', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Event Defaults */}
            <SettingsGroupCard title="ברירות מחדל לאירועים" icon={<ClockIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="משך אירוע ברירת מחדל"
                    description="משך ברירת מחדל לאירועים חדשים."
                >
                    <SegmentedControl
                        value={settings.calendarSettings.defaultEventDuration.toString()}
                        onChange={v => handleCalendarSettingChange('defaultEventDuration', parseInt(v))}
                        options={[
                            { label: '15 דק׳', value: '15' },
                            { label: '30 דק׳', value: '30' },
                            { label: 'שעה', value: '60' },
                            { label: '90 דק׳', value: '90' },
                        ]}
                    />
                </SettingsRow>
                <SettingsRow
                    title="תזכורת ברירת מחדל"
                    description="כמה דקות לפני אירוע לקבל תזכורת."
                >
                    <SegmentedControl
                        value={settings.calendarSettings.defaultReminderTime.toString()}
                        onChange={v => handleCalendarSettingChange('defaultReminderTime', parseInt(v))}
                        options={[
                            { label: '5 דק׳', value: '5' },
                            { label: '15 דק׳', value: '15' },
                            { label: '30 דק׳', value: '30' },
                            { label: 'שעה', value: '60' },
                        ]}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Working Hours */}
            <SettingsGroupCard title="שעות עבודה" icon={<SettingsIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="הצג שעות עבודה"
                    description="הדגש את שעות העבודה שלך בלוח השנה."
                >
                    <ToggleSwitch
                        checked={settings.calendarSettings.workingHoursEnabled}
                        onChange={v => handleCalendarSettingChange('workingHoursEnabled', v)}
                    />
                </SettingsRow>
                {settings.calendarSettings.workingHoursEnabled && (
                    <>
                        <SettingsRow title="שעת התחלה" description="מתי מתחיל יום העבודה.">
                            <input
                                type="time"
                                value={settings.calendarSettings.workingHoursStart}
                                onChange={e => handleCalendarSettingChange('workingHoursStart', e.target.value)}
                                className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:border-[var(--dynamic-accent-start)] outline-none"
                            />
                        </SettingsRow>
                        <SettingsRow title="שעת סיום" description="מתי מסתיים יום העבודה.">
                            <input
                                type="time"
                                value={settings.calendarSettings.workingHoursEnd}
                                onChange={e => handleCalendarSettingChange('workingHoursEnd', e.target.value)}
                                className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:border-[var(--dynamic-accent-start)] outline-none"
                            />
                        </SettingsRow>
                    </>
                )}
            </SettingsGroupCard>
        </SettingsSection>
    );
};

export default CalendarSection;


