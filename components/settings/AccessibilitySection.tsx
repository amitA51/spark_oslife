import React from 'react';
import {
    EyeIcon,
    VolumeIcon,
    SettingsIcon,
    PaletteIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
    SettingsSection,
    SettingsGroupCard,
    SettingsRow,

} from './SettingsComponents';

const AccessibilitySection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const handleAccessibilityChange = <K extends keyof typeof settings.accessibilitySettings>(
        key: K,
        value: (typeof settings.accessibilitySettings)[K]
    ) => {
        updateSettings({
            accessibilitySettings: {
                ...settings.accessibilitySettings,
                [key]: value,
            },
        });
    };

    return (
        <SettingsSection title="נגישות" id="accessibility">
            {/* Motion & Display */}
            <SettingsGroupCard title="תנועה ותצוגה" icon={<EyeIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="הפחת תנועה"
                    description="צמצם אנימציות ומעברים למינימום."
                >
                    <ToggleSwitch
                        checked={settings.accessibilitySettings.reduceMotion}
                        onChange={v => handleAccessibilityChange('reduceMotion', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="ניגודיות גבוהה"
                    description="הגבר את הניגודיות בין טקסט לרקע."
                >
                    <ToggleSwitch
                        checked={settings.accessibilitySettings.highContrast}
                        onChange={v => handleAccessibilityChange('highContrast', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="טקסט גדול"
                    description="הגדל את גודל הטקסט בכל האפליקציה."
                >
                    <ToggleSwitch
                        checked={settings.accessibilitySettings.largeText}
                        onChange={v => handleAccessibilityChange('largeText', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Screen Reader */}
            <SettingsGroupCard title="קורא מסך" icon={<VolumeIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="אופטימיזציה לקורא מסך"
                    description="שפר את התאימות לקוראי מסך."
                >
                    <ToggleSwitch
                        checked={settings.accessibilitySettings.screenReaderOptimized}
                        onChange={v => handleAccessibilityChange('screenReaderOptimized', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="הצג מדדי פוקוס"
                    description="הצג טבעות פוקוס ברורות סביב אלמנטים פעילים."
                >
                    <ToggleSwitch
                        checked={settings.accessibilitySettings.focusIndicators}
                        onChange={v => handleAccessibilityChange('focusIndicators', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="ניגון מדיה אוטומטי"
                    description="נגן וידאו ואודיו אוטומטית."
                >
                    <ToggleSwitch
                        checked={settings.accessibilitySettings.autoPlayMedia}
                        onChange={v => handleAccessibilityChange('autoPlayMedia', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Color & Keyboard */}
            <SettingsGroupCard title="צבעים ומקלדת" icon={<PaletteIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="מצב עיוורון צבעים"
                    description="התאם צבעים לסוג עיוורון הצבעים שלך."
                >
                    <select
                        value={settings.accessibilitySettings.colorBlindMode}
                        onChange={e => handleAccessibilityChange('colorBlindMode', e.target.value as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia')}
                        className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--dynamic-accent-start)] transition-all cursor-pointer"
                    >
                        <option value="none">ללא</option>
                        <option value="protanopia">פרוטנופיה (אדום)</option>
                        <option value="deuteranopia">דאוטרנופיה (ירוק)</option>
                        <option value="tritanopia">טריטנופיה (כחול)</option>
                    </select>
                </SettingsRow>
                <SettingsRow
                    title="קיצורי מקלדת"
                    description="הפעל ניווט וקיצורים במקלדת."
                    icon={<SettingsIcon className="w-4 h-4" />}
                >
                    <ToggleSwitch
                        checked={settings.accessibilitySettings.keyboardShortcutsEnabled}
                        onChange={v => handleAccessibilityChange('keyboardShortcutsEnabled', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>
        </SettingsSection>
    );
};

export default AccessibilitySection;


