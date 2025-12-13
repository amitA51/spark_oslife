import React from 'react';
import {
    CheckCircleIcon,
    ClockIcon,
    InboxIcon,
    LayoutIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
    SettingsSection,
    SettingsGroupCard,
    SettingsRow,
    SegmentedControl,
} from './SettingsComponents';

const TasksSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const handleTaskSettingChange = <K extends keyof typeof settings.taskSettings>(
        key: K,
        value: (typeof settings.taskSettings)[K]
    ) => {
        updateSettings({
            taskSettings: {
                ...settings.taskSettings,
                [key]: value,
            },
        });
    };

    return (
        <SettingsSection title="התנהגות משימות" id="tasks">
            {/* Priority & Defaults */}
            <SettingsGroupCard title="ברירות מחדל" icon={<CheckCircleIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="עדיפות ברירת מחדל"
                    description="עדיפות למשימות חדשות שנוצרות."
                >
                    <SegmentedControl
                        value={settings.taskSettings.defaultPriority}
                        onChange={v => handleTaskSettingChange('defaultPriority', v as 'low' | 'medium' | 'high')}
                        options={[
                            { label: 'נמוכה', value: 'low' },
                            { label: 'בינונית', value: 'medium' },
                            { label: 'גבוהה', value: 'high' },
                        ]}
                    />
                </SettingsRow>
                <SettingsRow
                    title="שעת יעד ברירת מחדל"
                    description="שעה ברירת מחדל למשימות עם תאריך יעד."
                >
                    <input
                        type="time"
                        value={settings.taskSettings.defaultDueTime}
                        onChange={e => handleTaskSettingChange('defaultDueTime', e.target.value)}
                        className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:border-[var(--dynamic-accent-start)] outline-none"
                    />
                </SettingsRow>
                <SettingsRow
                    title="תצוגת ברירת מחדל"
                    description="תצוגה ראשונית של רשימת המשימות."
                >
                    <SegmentedControl
                        value={settings.taskSettings.defaultListView}
                        onChange={v => handleTaskSettingChange('defaultListView', v as 'list' | 'kanban' | 'calendar')}
                        options={[
                            { label: 'רשימה', value: 'list' },
                            { label: 'קנבאן', value: 'kanban' },
                            { label: 'לוח שנה', value: 'calendar' },
                        ]}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Behavior */}
            <SettingsGroupCard title="התנהגות" icon={<ClockIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="העבר משימות באיחור להיום"
                    description="משימות שעבר יעד שלהן יעברו אוטומטית להיום."
                >
                    <ToggleSwitch
                        checked={settings.taskSettings.autoScheduleOverdue}
                        onChange={v => handleTaskSettingChange('autoScheduleOverdue', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="הצג התקדמות תת-משימות"
                    description="הצג אחוז השלמה של תת-משימות במשימה ההורה."
                >
                    <ToggleSwitch
                        checked={settings.taskSettings.showSubtaskProgress}
                        onChange={v => handleTaskSettingChange('showSubtaskProgress', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="סדר משימות שהושלמו למטה"
                    description="הזז משימות שהושלמו לתחתית הרשימה."
                >
                    <ToggleSwitch
                        checked={settings.taskSettings.sortCompletedToBottom}
                        onChange={v => handleTaskSettingChange('sortCompletedToBottom', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="הצג גיל משימה"
                    description="הצג כמה זמן המשימה פתוחה."
                >
                    <ToggleSwitch
                        checked={settings.taskSettings.showTaskAge}
                        onChange={v => handleTaskSettingChange('showTaskAge', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Natural Language & Archive */}
            <SettingsGroupCard title="תכונות מתקדמות" icon={<LayoutIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="פענוח שפה טבעית"
                    description="הבן תאריכים מטקסט כמו 'מחר' או 'השבוע'."
                >
                    <ToggleSwitch
                        checked={settings.taskSettings.enableNaturalLanguage}
                        onChange={v => handleTaskSettingChange('enableNaturalLanguage', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Archive Settings */}
            <SettingsGroupCard title="ארכיון" icon={<InboxIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="ארכיב משימות שהושלמו"
                    description="העבר משימות שהושלמו לארכיון אוטומטית."
                >
                    <ToggleSwitch
                        checked={settings.taskSettings.autoArchiveCompleted}
                        onChange={v => handleTaskSettingChange('autoArchiveCompleted', v)}
                    />
                </SettingsRow>
                {settings.taskSettings.autoArchiveCompleted && (
                    <SettingsRow
                        title="אחרי כמה ימים"
                        description="כמה ימים אחרי ההשלמה לארכב."
                    >
                        <SegmentedControl
                            value={settings.taskSettings.autoArchiveDays.toString()}
                            onChange={v => handleTaskSettingChange('autoArchiveDays', parseInt(v))}
                            options={[
                                { label: '7', value: '7' },
                                { label: '14', value: '14' },
                                { label: '30', value: '30' },
                            ]}
                        />
                    </SettingsRow>
                )}
            </SettingsGroupCard>
        </SettingsSection>
    );
};

export default TasksSection;


