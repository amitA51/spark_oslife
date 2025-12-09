import React, { useState, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsCategory, SettingItem, getCategoryInfo } from '../components/settings/settingsRegistry';
import { Screen } from '../types';
import { useSettings } from '../src/contexts/SettingsContext';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';

// Import new premium components
import SettingsHeader from '../components/settings/SettingsHeader';
import SettingsSearch from '../components/settings/SettingsSearch';
import SettingsFavorites from '../components/settings/SettingsFavorites';
import SettingsGroups from '../components/settings/SettingsGroups';
import SettingsSheet from '../components/settings/SettingsSheet';

// Lazy load section components for better performance
const AppearanceSection = lazy(() => import('../components/settings/AppearanceSection'));
const AISection = lazy(() => import('../components/settings/AISection'));
const GeneralSection = lazy(() => import('../components/settings/GeneralSection'));
const IntegrationsSection = lazy(() => import('../components/settings/IntegrationsSection'));
const DataSection = lazy(() => import('../components/settings/DataSection'));
const WorkoutSection = lazy(() => import('../components/settings/WorkoutSection'));
const AboutSection = lazy(() => import('../components/settings/AboutSection'));
const FocusSection = lazy(() => import('../components/settings/FocusSection'));
const ProfileSection = lazy(() => import('../components/settings/ProfileSection'));

type Status = {
  type: StatusMessageType;
  text: string;
  id: number;
  onUndo?: () => void;
} | null;

// Map ALL categories to section components
const SECTION_COMPONENTS: Partial<Record<SettingsCategory, React.ComponentType<any>>> = {
  profile: ProfileSection,
  appearance: AppearanceSection,
  behavior: GeneralSection,
  interface: GeneralSection,
  focus: FocusSection,
  workout: WorkoutSection,
  ai: AISection,
  sync: IntegrationsSection,
  data: DataSection,
  about: AboutSection,
};

// Section loading skeleton
const SectionSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-32 bg-white/[0.08] rounded-lg" />
    <div className="h-40 bg-white/[0.05] rounded-2xl" />
    <div className="h-32 bg-white/[0.05] rounded-2xl" />
  </div>
);

const SettingsScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({
  setActiveScreen,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { settings } = useSettings(); // Reserved for future settings-dependent UI

  // State
  const [activeCategory, setActiveCategory] = useState<SettingsCategory | null>(null);
  const [statusMessage, setStatusMessage] = useState<Status>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Handle category selection - opens bottom sheet on mobile
  const handleSelectCategory = useCallback((category: SettingsCategory) => {
    setActiveCategory(category);
    setIsSheetOpen(true);
    navigator.vibrate?.(10);
  }, []);

  // Handle setting selection from search
  const handleSelectSetting = useCallback((setting: SettingItem) => {
    setActiveCategory(setting.category);
    setIsSheetOpen(true);
    navigator.vibrate?.(10);

    // Track recent setting
    try {
      const recent = JSON.parse(localStorage.getItem('settings_recent') || '[]');
      const newRecent = [
        { id: setting.id, title: setting.title, category: setting.category, timestamp: Date.now() },
        ...recent.filter((r: { id: string }) => r.id !== setting.id)
      ].slice(0, 10);
      localStorage.setItem('settings_recent', JSON.stringify(newRecent));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Close sheet
  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
    setActiveCategory(null);
  }, []);

  // Get current section component
  const renderSectionContent = useCallback(() => {
    if (!activeCategory) return null;

    const SectionComponent = SECTION_COMPONENTS[activeCategory];
    if (!SectionComponent) {
      return (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <p>קטגוריה זו עדיין בפיתוח</p>
        </div>
      );
    }

    // Props for sections that need them
    const sectionProps: Record<string, Record<string, unknown>> = {
      profile: { setStatusMessage },
      sync: { setStatusMessage },
      data: { setActiveScreen, setStatusMessage },
      behavior: { setStatusMessage },
      interface: { setStatusMessage },
    };

    return (
      <Suspense fallback={<SectionSkeleton />}>
        <SectionComponent {...(sectionProps[activeCategory] || {})} />
      </Suspense>
    );
  }, [activeCategory, setActiveScreen]);

  // Get category info for sheet header
  const activeCategoryInfo = activeCategory ? getCategoryInfo(activeCategory) : null;

  return (
    <>
      <div className="min-h-screen pb-32">
        {/* Premium Parallax Header */}
        <SettingsHeader />

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky top-[70px] z-30 py-3 -mx-1 px-1
                     bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent"
        >
          <SettingsSearch
            onSelectSetting={handleSelectSetting}
            onSelectCategory={handleSelectCategory}
          />
        </motion.div>

        {/* Main Content */}
        <main className="mt-6 space-y-8 px-0">
          {/* Favorites & Recent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SettingsFavorites
              onSelectSetting={handleSelectSetting}
              onViewAll={() => { }}
            />
          </motion.div>

          {/* iOS-Style Grouped Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SettingsGroups onSelectCategory={handleSelectCategory} />
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-6 text-xs text-[var(--text-tertiary)]"
          >
            <p>Spark OS v2.0.0</p>
            <p className="mt-1">נבנה עם ❤️ עבורך</p>
          </motion.div>
        </main>
      </div>

      {/* Bottom Sheet for Category Content */}
      <SettingsSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        title={activeCategoryInfo?.title || 'הגדרות'}
        icon={
          activeCategoryInfo && (
            <span className="text-xl">{activeCategoryInfo.icon}</span>
          )
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {renderSectionContent()}
          </motion.div>
        </AnimatePresence>
      </SettingsSheet>

      {/* Status Messages */}
      {statusMessage && (
        <StatusMessage
          key={statusMessage.id}
          type={statusMessage.type}
          message={statusMessage.text}
          onDismiss={() => setStatusMessage(null)}
          onUndo={statusMessage.onUndo}
        />
      )}
    </>
  );
};

export default SettingsScreen;
