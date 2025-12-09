import React from 'react';
import ProfileCard from './ProfileCard';
import { SettingsSection, SettingsCard, SettingsRow } from './SettingsComponents';
import { useSettings } from '../../src/contexts/SettingsContext';
import { StatusMessageType } from '../../components/StatusMessage';
import { UserIcon, SparklesIcon } from '../../components/icons';

interface ProfileSectionProps {
    setStatusMessage: (msg: { type: StatusMessageType; text: string; id: number } | null) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ setStatusMessage }) => {
    const { settings, updateSettings } = useSettings();

    return (
        <SettingsSection title="פרופיל" id="profile">
            {/* Profile Card */}
            <ProfileCard setStatusMessage={setStatusMessage} />

            {/* Additional Profile Settings */}
            <SettingsCard title="התאמה אישית" icon={<SparklesIcon className="w-5 h-5" />}>
                <SettingsRow
                    title="אימוג'י אישי"
                    description="בחר אימוג'י שמייצג אותך בממשק"
                    icon={<SparklesIcon className="w-4 h-4" />}
                >
                    <input
                        type="text"
                        value={settings.userEmoji || '😊'}
                        onChange={(e) => updateSettings({ userEmoji: e.target.value })}
                        className="w-16 h-12 text-2xl text-center bg-white/[0.08] border border-white/[0.15] 
                       rounded-xl focus:border-[var(--dynamic-accent-start)] 
                       focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 
                       outline-none transition-all cursor-pointer"
                        maxLength={2}
                    />
                </SettingsRow>

                <SettingsRow
                    title="שם תצוגה"
                    description="איך ייקרא לך באפליקציה"
                    icon={<UserIcon className="w-4 h-4" />}
                >
                    <input
                        type="text"
                        value={settings.userName || ''}
                        onChange={(e) => updateSettings({ userName: e.target.value })}
                        placeholder="הכנס שם..."
                        className="w-40 px-3 py-2 text-sm text-white bg-white/[0.08] 
                       border border-white/[0.15] rounded-xl
                       focus:border-[var(--dynamic-accent-start)] 
                       focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 
                       outline-none transition-all placeholder:text-[var(--text-tertiary)]"
                        dir="rtl"
                    />
                </SettingsRow>
            </SettingsCard>
        </SettingsSection>
    );
};

export default ProfileSection;
