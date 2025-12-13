import React, { useState } from 'react';
import {
    InfoIcon,
    StarIcon,
    ShareIcon,
    HeartIcon,
    CodeIcon,
    SparklesIcon,
} from '../../components/icons';
import {
    SettingsSection,
    SettingsGroupCard,
    SettingsLinkRow,
    SettingsInfoBanner,
} from './SettingsComponents';
import ChangelogModal from '../ChangelogModal';
import LegalModals from '../LegalModals';

const AboutSection: React.FC = () => {
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [legalModalConfig, setLegalModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        type: 'terms' | 'privacy';
    }>({
        isOpen: false,
        title: '',
        type: 'terms'
    });

    const appVersion = '2.0.0';
    const buildNumber = '2024.12.05';

    const handleRateApp = () => {
        // Open app store rating
        window.open('https://play.google.com/store', '_blank');
    };

    const handleShareApp = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Spark OS',
                text: 'גלה את Spark OS - האפליקציה שתשנה את החיים שלך!',
                url: window.location.origin,
            });
        } else {
            navigator.clipboard.writeText(window.location.origin);
        }
    };

    const handleOpenChangelog = () => {
        setIsChangelogOpen(true);
    };

    return (
        <SettingsSection title="אודות האפליקציה" id="about">
            {/* App Info Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--dynamic-accent-start)]/20 to-[var(--dynamic-accent-end)]/10 border border-[var(--dynamic-accent-start)]/30 p-6 mb-4">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--dynamic-accent-start)]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--dynamic-accent-end)]/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] flex items-center justify-center shadow-lg shadow-[var(--dynamic-accent-glow)]/30">
                        <SparklesIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Spark OS</h3>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">הפלטפורמה המלאה לחיים טובים יותר</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-[var(--text-secondary)]">
                                v{appVersion}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                                Build {buildNumber}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <SettingsGroupCard title="פעולות">
                <div className="space-y-2">
                    <SettingsLinkRow
                        title="דרג את האפליקציה"
                        description="עזור לנו להגיע ליותר אנשים"
                        icon={<StarIcon className="w-5 h-5" />}
                        onClick={handleRateApp}
                        badge="⭐ 5"
                        badgeColor="warning"
                    />
                    <SettingsLinkRow
                        title="שתף עם חברים"
                        description="הזמן אחרים להצטרף"
                        icon={<ShareIcon className="w-5 h-5" />}
                        onClick={handleShareApp}
                    />
                    <SettingsLinkRow
                        title="מה חדש"
                        description="צפה בעדכונים האחרונים"
                        icon={<SparklesIcon className="w-5 h-5" />}
                        onClick={handleOpenChangelog}
                        badge="חדש!"
                        badgeColor="accent"
                    />
                </div>
            </SettingsGroupCard>

            <SettingsGroupCard title="קהילה ותמיכה">
                <div className="space-y-2">
                    <SettingsLinkRow
                        title="מרכז העזרה"
                        description="שאלות נפוצות ומדריכים"
                        icon={<InfoIcon className="w-5 h-5" />}
                        onClick={() => window.open('https://help.sparkos.app', '_blank')}
                    />
                    <SettingsLinkRow
                        title="הצטרף לקהילה"
                        description="דיונים, טיפים והשראה"
                        icon={<HeartIcon className="w-5 h-5" />}
                        onClick={() => window.open('https://community.sparkos.app', '_blank')}
                    />
                    <SettingsLinkRow
                        title="קוד פתוח"
                        description="תרום לפרויקט ב-GitHub"
                        icon={<CodeIcon className="w-5 h-5" />}
                        onClick={() => window.open('https://github.com/sparkos', '_blank')}
                    />
                </div>
            </SettingsGroupCard>

            <SettingsInfoBanner variant="tip">
                <strong>Spark OS</strong> נבנה באהבה כדי לעזור לך להגשים יותר ולחיות טוב יותר.
                תודה שאתה חלק מהמסע! 🚀
            </SettingsInfoBanner>

            {/* Footer */}
            <div className="text-center py-6 space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">
                    © 2024 Spark OS. כל הזכויות שמורות.
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
                    <button
                        onClick={() => setLegalModalConfig({ isOpen: true, title: 'תנאי שימוש', type: 'terms' })}
                        className="hover:text-white transition-colors"
                    >
                        תנאי שימוש
                    </button>
                    <span>•</span>
                    <button
                        onClick={() => setLegalModalConfig({ isOpen: true, title: 'מדיניות פרטיות', type: 'privacy' })}
                        className="hover:text-white transition-colors"
                    >
                        מדיניות פרטיות
                    </button>
                </div>
            </div>

            <ChangelogModal
                isOpen={isChangelogOpen}
                onClose={() => setIsChangelogOpen(false)}
            />

            <LegalModals
                isOpen={legalModalConfig.isOpen}
                onClose={() => setLegalModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={legalModalConfig.title}
                type={legalModalConfig.type}
            />
        </SettingsSection>
    );
};

export default AboutSection;


