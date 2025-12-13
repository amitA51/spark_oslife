import React from 'react';
import ProfileCard from './ProfileCard';
import { SettingsSection, SettingsGroupCard, SettingsRow } from './SettingsComponents';
import { useSettings } from '../../src/contexts/SettingsContext';
import { StatusMessageType } from '../../components/StatusMessage';
import { UserIcon, SparklesIcon, TrashIcon, AlertOctagonIcon } from '../../components/icons';
import { deleteUserAccount } from '../../services/authService';

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
            <SettingsGroupCard title="התאמה אישית" icon={<SparklesIcon className="w-5 h-5" />}>
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
            </SettingsGroupCard>

            {/* Danger Zone */}
            <div className="mt-8 relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5">
                <div className="p-4 border-b border-red-500/10 flex items-center gap-3">
                    <AlertOctagonIcon className="w-5 h-5 text-red-400" />
                    <h3 className="text-red-100 font-semibold">אזור סכנה</h3>
                </div>

                <div className="p-4">
                    <p className="text-xs text-red-200/70 mb-4 leading-relaxed">
                        מחיקת החשבון היא פעולה בלתי הפיכה. כל המידע שלך, כולל יומנים, משימות והגדרות יימחקו לצמיתות ולא ניתן יהיה לשחזר אותם.
                    </p>

                    <button
                        onClick={async () => {
                            if (window.confirm('האם אתה בטוח שברצונך למחוק את החשבון לצמיתות? פעולה זו אינה הפיכה.')) {
                                const doubleCheck = window.prompt('כדי לאשר מחיקה, הקלד "מחק" בתיבה למטה:');
                                if (doubleCheck === 'מחק') {
                                    try {
                                        await deleteUserAccount();
                                        // Force reload to trigger auth state change and redirect
                                        window.location.reload();
                                    } catch (err) {
                                        const msg = err instanceof Error ? err.message : 'אירעה שגיאה במחיקת החשבון';
                                        setStatusMessage({ type: 'error', text: msg, id: Date.now() });
                                    }
                                }
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl 
                                 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 
                                 border border-red-500/20 transition-all text-sm font-medium"
                    >
                        <TrashIcon className="w-4 h-4" />
                        מחק את החשבון שלי
                    </button>
                </div>
            </div>
        </SettingsSection >
    );
};

export default ProfileSection;


