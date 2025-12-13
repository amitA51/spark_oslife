import React from 'react';
import {
    LockIcon,
    ShieldCheckIcon,
    EyeIcon,
    TrashIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
    SettingsSection,
    SettingsGroupCard,
    SettingsRow,
    SegmentedControl,
} from './SettingsComponents';

const PrivacySection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const handlePrivacyChange = <K extends keyof typeof settings.privacySettings>(
        key: K,
        value: (typeof settings.privacySettings)[K]
    ) => {
        updateSettings({
            privacySettings: {
                ...settings.privacySettings,
                [key]: value,
            },
        });
    };

    return (
        <SettingsSection title="פרטיות ואבטחה" id="privacy">
            {/* App Lock */}
            <SettingsGroupCard title="נעילת אפליקציה" icon={<LockIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="נעילת אפליקציה"
                    description="דרוש נעילה בכל פעם שהאפליקציה נפתחת."
                >
                    <ToggleSwitch
                        checked={settings.privacySettings.lockAppEnabled}
                        onChange={v => handlePrivacyChange('lockAppEnabled', v)}
                    />
                </SettingsRow>
                {settings.privacySettings.lockAppEnabled && (
                    <>
                        <SettingsRow
                            title="שימוש בביומטריה"
                            description="השתמש בטביעת אצבע או זיהוי פנים."
                        >
                            <ToggleSwitch
                                checked={settings.privacySettings.useBiometrics}
                                onChange={v => handlePrivacyChange('useBiometrics', v)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            title="נעילה אוטומטית אחרי"
                            description="כמה דקות לחכות לפני נעילה אוטומטית."
                        >
                            <SegmentedControl
                                value={settings.privacySettings.lockTimeout.toString()}
                                onChange={v => handlePrivacyChange('lockTimeout', parseInt(v))}
                                options={[
                                    { label: '1 דק׳', value: '1' },
                                    { label: '5 דק׳', value: '5' },
                                    { label: '15 דק׳', value: '15' },
                                    { label: '30 דק׳', value: '30' },
                                ]}
                            />
                        </SettingsRow>
                    </>
                )}
            </SettingsGroupCard>

            {/* Privacy */}
            <SettingsGroupCard title="פרטיות" icon={<EyeIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="הסתר תוכן בהתראות"
                    description="הצג התראות כלליות ללא פרטים."
                >
                    <ToggleSwitch
                        checked={settings.privacySettings.hidePreviewsInNotifications}
                        onChange={v => handlePrivacyChange('hidePreviewsInNotifications', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="הסתר פרטים בווידג'טים"
                    description="הצג מידע כללי בלבד בווידג'טים."
                >
                    <ToggleSwitch
                        checked={settings.privacySettings.hideDetailsInWidgets}
                        onChange={v => handlePrivacyChange('hideDetailsInWidgets', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="מצב פרטי"
                    description="השבת זמנית את כל המעקב והאיסוף."
                >
                    <ToggleSwitch
                        checked={settings.privacySettings.incognitoMode}
                        onChange={v => handlePrivacyChange('incognitoMode', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Data & Analytics */}
            <SettingsGroupCard title="נתונים ואנליטיקה" icon={<ShieldCheckIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="אנליטיקה"
                    description="אפשר איסוף נתוני שימוש אנונימיים לשיפור האפליקציה."
                >
                    <ToggleSwitch
                        checked={settings.privacySettings.analyticsEnabled}
                        onChange={v => handlePrivacyChange('analyticsEnabled', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="דוחות קריסה"
                    description="שלח דוחות קריסה למפתחים לתיקון באגים."
                >
                    <ToggleSwitch
                        checked={settings.privacySettings.crashReportsEnabled}
                        onChange={v => handlePrivacyChange('crashReportsEnabled', v)}
                    />
                </SettingsRow>
            </SettingsGroupCard>

            {/* Danger Zone */}
            <SettingsGroupCard title="אזור סכנה" icon={<TrashIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="מחק נתונים בהתנתקות"
                    description="מחק את כל הנתונים המקומיים כשאתה מתנתק."
                >
                    <ToggleSwitch
                        checked={settings.privacySettings.clearDataOnLogout}
                        onChange={v => handlePrivacyChange('clearDataOnLogout', v)}
                    />
                </SettingsRow>
                <SettingsRow
                    title="אישורי מחיקה"
                    description="בקש אישור לפני מחיקת פריטים."
                >
                    <ToggleSwitch
                        checked={settings.showConfirmDialogs}
                        onChange={v => updateSettings({ showConfirmDialogs: v })}
                    />
                </SettingsRow>
            </SettingsGroupCard>
        </SettingsSection>
    );
};

export default PrivacySection;


