import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SparklesIcon, ChevronRightIcon } from '../icons';
import { useSettings } from '../../src/contexts/SettingsContext';
import { useUser } from '../../src/contexts/UserContext';

interface SettingsHeaderProps {
    onBackClick?: () => void;
    showBackButton?: boolean;
    title?: string;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
    onBackClick,
    showBackButton = false,
    title
}) => {
    const { settings } = useSettings();
    const { user } = useUser();
    const [imgError, setImgError] = useState(false);

    const { scrollY } = useScroll();

    // Parallax transforms
    const headerHeight = useTransform(scrollY, [0, 100], [140, 70]);
    const avatarScale = useTransform(scrollY, [0, 100], [1, 0.7]);
    const avatarY = useTransform(scrollY, [0, 100], [0, 10]);
    const titleOpacity = useTransform(scrollY, [0, 50], [1, 0]);
    const subtitleOpacity = useTransform(scrollY, [0, 30], [1, 0]);
    const compactTitleOpacity = useTransform(scrollY, [60, 100], [0, 1]);
    const headerBlur = useTransform(scrollY, [0, 50], [0, 20]);
    const headerBg = useTransform(
        scrollY,
        [0, 50],
        ['rgba(0,0,0,0)', 'rgba(var(--bg-primary-rgb), 0.8)']
    );

    useEffect(() => {
        setImgError(false);
    }, [user?.photoURL]);

    return (
        <motion.header
            style={{
                height: headerHeight,
                backgroundColor: headerBg,
                backdropFilter: `blur(${headerBlur}px)`,
            }}
            className="sticky top-0 z-40 -mx-4 px-4 flex items-center 
                 border-b border-transparent transition-colors"
        >
            <div className="w-full flex items-center gap-4">
                {/* Back Button (when in sub-screen) */}
                {showBackButton && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onBackClick}
                        className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] 
                       transition-colors active:scale-95"
                    >
                        <ChevronRightIcon className="w-5 h-5 text-white" />
                    </motion.button>
                )}

                {/* Avatar */}
                <motion.div
                    style={{ scale: avatarScale, y: avatarY }}
                    className="relative flex-shrink-0"
                >
                    <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
            bg-gradient-to-br from-[var(--dynamic-accent-start)]/20 to-[var(--dynamic-accent-end)]/10
            border border-[var(--dynamic-accent-start)]/30
            shadow-[0_0_30px_var(--dynamic-accent-glow)]
          `}>
                        {user?.photoURL && !imgError ? (
                            <img
                                src={user.photoURL}
                                alt="Profile"
                                className="w-full h-full rounded-2xl object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            settings.userEmoji || '⚙️'
                        )}
                    </div>

                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full 
                          bg-emerald-500 border-2 border-[var(--bg-primary)]
                          shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </motion.div>

                {/* Title Section */}
                <div className="flex-1 min-w-0 relative">
                    {/* Full title (visible when not scrolled) */}
                    <motion.div style={{ opacity: titleOpacity }}>
                        <h1 className="text-2xl font-bold text-white truncate">
                            {title || settings.screenLabels?.settings || 'הגדרות'}
                        </h1>
                        <motion.p
                            style={{ opacity: subtitleOpacity }}
                            className="text-sm text-[var(--text-secondary)] truncate"
                        >
                            {user?.displayName || settings.userName || 'התאם את החוויה שלך'}
                        </motion.p>
                    </motion.div>

                    {/* Compact title (visible when scrolled) */}
                    <motion.div
                        style={{ opacity: compactTitleOpacity }}
                        className="absolute top-1/2 right-0 -translate-y-1/2"
                    >
                        <h1 className="text-lg font-semibold text-white">
                            {title || 'הגדרות'}
                        </h1>
                    </motion.div>
                </div>

                {/* Quick Action Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] 
                     border border-white/[0.08] hover:border-white/[0.15]
                     transition-all duration-200
                     shadow-lg shadow-black/10"
                >
                    <SparklesIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                </motion.button>
            </div>
        </motion.header>
    );
};

export default SettingsHeader;
