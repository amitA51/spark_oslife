import React from 'react';
import {
    SparklesIcon,
    LinkIcon,
    BrainCircuitIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
    SettingsSection,
    SettingsGroupCard,
    SettingsRow,
} from './SettingsComponents';

const SmartFeaturesSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const handleSmartSettingChange = <K extends keyof typeof settings.smartFeaturesSettings>(
        key: K,
        value: (typeof settings.smartFeaturesSettings)[K]
    ) => {
        updateSettings({
            smartFeaturesSettings: {
                ...settings.smartFeaturesSettings,
                [key]: value,
            },
        });
    };

    return (
        <SettingsSection title="תכונות חכמות" id="smart">
            {/* AI Features */}
            <SettingsGroupCard title="AI ותזכורות" icon={<BrainCircuitIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="תזכורות חכמות"
                    description="הצעות AI לזמני תזכורת מיטביים."
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.smartReminders}
                        onChange={v => handleSmartSettingChange('smartReminders', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="תזמון חכם"
                    description="הצע זמנים טובים יותר לביצוע משימות."
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.smartReschedule}
                        onChange={v => handleSmartSettingChange('smartReschedule', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="עזרה בכתיבה"
                    description="עזרת AI בכתיבת תוכן ומשימות."
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.aiWritingAssist}
                        onChange={v => handleSmartSettingChange('aiWritingAssist', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Auto Features */}
            <SettingsGroupCard title="זיהוי אוטומטי" icon={<SparklesIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="הצעות תגיות"
                    description="הצע תגיות בהתבסס על התוכן."
                    icon={<SparklesIcon className="w-4 h-4" />}
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.autoTagSuggestions}
                        onChange={v => handleSmartSettingChange('autoTagSuggestions', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="זיהוי כפילויות"
                    description="הזהר כשאתה יוצר פריט דומה לקיים."
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.duplicateDetection}
                        onChange={v => handleSmartSettingChange('duplicateDetection', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="זיהוי קישורים"
                    description="הפוך טקסט של קישורים לקישורים לחיצים."
                    icon={<LinkIcon className="w-4 h-4" />}
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.autoLinkDetection}
                        onChange={v => handleSmartSettingChange('autoLinkDetection', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Formatting */}
            <SettingsGroupCard title="עיצוב וקישורים" icon={<LinkIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="תמיכה ב-Markdown"
                    description="הפעל עיצוב Markdown בהערות ותיאורים."
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.markdownEnabled}
                        onChange={v => handleSmartSettingChange('markdownEnabled', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="קישורים חוזרים"
                    description="צור קישורים חוזרים אוטומטית (בסגנון Obsidian)."
                >
                    <ToggleSwitch
                        checked={settings.smartFeaturesSettings.autoBacklinks}
                        onChange={v => handleSmartSettingChange('autoBacklinks', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>
        </SettingsSection>
    );
};

export default SmartFeaturesSection;


