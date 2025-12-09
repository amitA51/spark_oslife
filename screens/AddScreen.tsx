import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import type { Screen } from '../types';
import {
  CheckCircleIcon,
  LinkIcon,
  ClipboardListIcon,
  BookOpenIcon,
  DumbbellIcon,
  ChartBarIcon,
  SparklesIcon,
  SummarizeIcon,
  UserIcon,
  LightbulbIcon,
  RoadmapIcon,
  EditIcon,
  CloseIcon,
} from '../components/icons';
import { ItemCreationForm } from '../components/ItemCreationForm';
import { AddableType } from '../types';
import { useSettings } from '../src/contexts/SettingsContext';
import { useHaptics } from '../hooks/useHaptics';
import SmartSearchBar from '../components/add/SmartSearchBar';
import TemplateCarousel, { TemplatePreset } from '../components/add/TemplateCarousel';
import { AddScreenSkeleton } from '../components/add';
import { useAISuggestions } from '../hooks/add/useAISuggestions';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceInputModal = lazy(() => import('../components/VoiceInputModal'));

interface AddScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const allItemTypes: { type: AddableType; label: string; icon: React.ReactNode; color: string; gradient: string }[] = [
  { type: 'spark', label: 'ספארק', icon: <SparklesIcon />, color: '#00D4FF', gradient: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)' },
  { type: 'idea', label: 'רעיון', icon: <LightbulbIcon />, color: '#FBBF24', gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
  { type: 'note', label: 'פתק', icon: <ClipboardListIcon />, color: '#FCD34D', gradient: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)' },
  { type: 'task', label: 'משימה', icon: <CheckCircleIcon />, color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
  { type: 'link', label: 'קישור', icon: <LinkIcon />, color: '#60A5FA', gradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
  { type: 'learning', label: 'למידה', icon: <SummarizeIcon />, color: '#38BDF8', gradient: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' },
  { type: 'journal', label: 'יומן', icon: <UserIcon />, color: '#F0ABFC', gradient: 'linear-gradient(135deg, #F0ABFC 0%, #D946EF 100%)' },
  { type: 'book', label: 'ספר', icon: <BookOpenIcon />, color: '#A78BFA', gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)' },
  { type: 'workout', label: 'אימון', icon: <DumbbellIcon />, color: '#F472B6', gradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' },
  { type: 'roadmap', label: 'מפת דרכים', icon: <RoadmapIcon />, color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' },
  { type: 'ticker', label: 'מניה / מטבע', icon: <ChartBarIcon />, color: '#94A3B8', gradient: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)' },
];

// Premium Card Component with glass morphism
const PremiumItemCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  color: string;
  gradient: string;
  index: number;
  isEditing?: boolean;
}> = ({ icon, label, onClick, color, gradient, index, isEditing }) => (
  <motion.button
    onClick={onClick}
    disabled={isEditing}
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 25,
      delay: index * 0.04,
    }}
    whileHover={{
      scale: 1.05,
      y: -4,
      transition: { type: 'spring', stiffness: 400, damping: 20 }
    }}
    whileTap={{ scale: 0.95 }}
    className={`
      group relative overflow-hidden
      bg-white/[0.04] backdrop-blur-2xl
      border border-white/[0.08]
      rounded-3xl
      p-4 sm:p-5
      flex flex-col items-center justify-center gap-3
      min-h-[100px] sm:min-h-[110px]
      transition-colors duration-300
      ${isEditing ? 'opacity-50 cursor-grab' : 'cursor-pointer'}
      hover:border-white/[0.15]
      focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
    `}
    style={{
      boxShadow: `0 4px 24px -8px ${color}20`,
    }}
    aria-label={`הוסף ${label}`}
  >
    {/* Subtle top shine */}
    <div
      className="absolute top-0 left-0 right-0 h-[1px] opacity-60"
      style={{
        background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.12) 50%, transparent 90%)',
      }}
    />

    {/* Hover gradient overlay */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
      style={{
        background: `radial-gradient(circle at 50% 0%, ${color}15 0%, transparent 60%)`,
      }}
    />

    {/* Icon Container with gradient background */}
    <div
      className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
      style={{
        background: gradient,
        boxShadow: `0 8px 24px -4px ${color}40`,
      }}
    >
      {/* Inner glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-40"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
        }}
      />

      {/* Icon */}
      <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center relative z-10 text-white">
        {React.isValidElement<{ className?: string }>(icon)
          ? React.cloneElement(icon, {
            ...icon.props,
            className: 'w-full h-full',
          })
          : icon}
      </div>
    </div>

    {/* Label */}
    <span className="relative z-10 font-semibold text-white/90 text-xs sm:text-sm text-center tracking-wide group-hover:text-white transition-colors duration-300">
      {label}
    </span>
  </motion.button>
);

const AddScreen: React.FC<AddScreenProps> = ({ setActiveScreen }) => {
  const { settings, updateSettings } = useSettings();
  const { triggerHaptic } = useHaptics();
  const { timeGreeting, motivationalMessage } = useAISuggestions();

  const [addScreenLayout, setAddScreenLayout] = useState(settings.addScreenLayout);
  const [selectedType, setSelectedType] = useState<AddableType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dragItem = useRef<AddableType | null>(null);
  const dragOverItem = useRef<AddableType | null>(null);
  const [, setForceRender] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && selectedType) {
      e.preventDefault();
      handleCloseForm();
      return;
    }

    if (!selectedType && !isEditing && e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (index < addScreenLayout.length) {
        e.preventDefault();
        const type = addScreenLayout[index];
        if (type) {
          handleItemClick(type, undefined);
        }
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'e' && !selectedType) {
      e.preventDefault();
      setIsEditing(prev => !prev);
    }
  }, [selectedType, isEditing, addScreenLayout]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setAddScreenLayout(settings.addScreenLayout);
  }, [settings.addScreenLayout]);

  useEffect(() => {
    const preselect = sessionStorage.getItem('preselect_add');
    if (preselect && allItemTypes.some(it => it.type === preselect)) {
      setSelectedType(preselect as AddableType);
      sessionStorage.removeItem('preselect_add');
    }

    const sharedData = sessionStorage.getItem('sharedData');
    if (sharedData) {
      const { url } = JSON.parse(sharedData);
      if (url) {
        setSelectedType('link');
      } else {
        setSelectedType('note');
      }
    }
  }, []);

  const handleLayoutChange = (newLayout: AddableType[]) => {
    setAddScreenLayout(newLayout);
    updateSettings({ addScreenLayout: newLayout });
  };

  const handleDrop = () => {
    if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
      const currentLayout = [...addScreenLayout];
      const dragItemIndex = currentLayout.indexOf(dragItem.current);
      const dragOverItemIndex = currentLayout.indexOf(dragOverItem.current);

      const [removed]: AddableType[] = currentLayout.splice(dragItemIndex, 1);
      if (removed) {
        currentLayout.splice(dragOverItemIndex, 0, removed);
      }

      handleLayoutChange(currentLayout);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setForceRender(c => c + 1);
  };

  const handleHideItem = (typeToHide: AddableType) => {
    triggerHaptic('medium');
    const newLayout = addScreenLayout.filter(type => type !== typeToHide);
    handleLayoutChange(newLayout);
  };

  const handleItemClick = (type: AddableType, data?: Record<string, unknown>) => {
    triggerHaptic('light');
    // Store prefilled data in sessionStorage for ItemCreationForm to pick up
    if (data && Object.keys(data).length > 0) {
      sessionStorage.setItem('preselect_add_defaults', JSON.stringify(data));
    }
    setSelectedType(type);
  };

  const handleCloseForm = () => {
    setSelectedType(null);
    sessionStorage.removeItem('preselect_add_defaults');
  };

  if (isLoading) {
    return <AddScreenSkeleton />;
  }

  return (
    <div className="screen-shell pb-24 relative overflow-hidden">
      {/* Premium Deep Cosmos Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary ambient glow */}
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-40"
          style={{
            background: 'radial-gradient(circle, var(--dynamic-accent-start) 0%, transparent 70%)',
          }}
        />
        {/* Secondary subtle glow */}
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--dynamic-accent-end) 0%, transparent 70%)',
          }}
        />
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 sm:px-6">
        {/* Hero Header Section */}
        <motion.header
          className="pt-4 pb-6 sm:pb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Top Bar with Edit Button */}
          <div className="flex items-center justify-between mb-6">
            {/* Edit Toggle */}
            <motion.button
              onClick={() => setIsEditing(!isEditing)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-3 rounded-2xl border transition-all duration-300
                ${isEditing
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15]'
                }
              `}
              aria-label={isEditing ? 'סיים עריכה' : 'ערוך פריסה'}
            >
              {isEditing ? (
                <CloseIcon className="w-5 h-5" />
              ) : (
                <EditIcon className="w-5 h-5" />
              )}
            </motion.button>

            {/* Premium Time Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
              className="px-5 py-2 rounded-full backdrop-blur-xl border border-white/[0.08]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              }}
            >
              <span
                className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"
              >
                ✨ {timeGreeting}
              </span>
            </motion.div>

            {/* Spacer for alignment */}
            <div className="w-11" />
          </div>

          {/* Main Title - Show when search is not expanded */}
          <AnimatePresence>
            {!isSearchExpanded && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <h1 className="text-4xl sm:text-5xl font-black mb-3">
                  <span
                    className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent"
                    style={{
                      textShadow: '0 0 40px var(--dynamic-accent-glow)',
                    }}
                  >
                    מה להוסיף?
                  </span>
                </h1>
                <p className="text-sm text-white/50 font-medium max-w-xs mx-auto">
                  {motivationalMessage}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Smart Search Bar */}
        {!isEditing && (
          <SmartSearchBar
            onCreateItem={handleItemClick}
            onVoiceInput={() => setIsVoiceModalOpen(true)}
            isExpanded={isSearchExpanded}
            onToggleExpand={setIsSearchExpanded}
          />
        )}

        {/* Premium Item Grid - Quick Creation (NOW FIRST) */}
        <AnimatePresence mode="wait">
          {!selectedType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`${isSearchExpanded ? 'mt-4' : 'mt-2'}`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                  יצירה מהירה
                </h2>
                {isEditing && (
                  <span className="text-[10px] text-cyan-400/60 font-medium">
                    גרור לסידור מחדש
                  </span>
                )}
              </div>

              {/* The Grid - 3 columns on mobile, 4 on tablet, 5 on desktop */}
              <div
                className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-w-3xl mx-auto"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                {addScreenLayout.map((type, index) => {
                  const item = allItemTypes.find(it => it.type === type);
                  if (!item) return null;
                  return (
                    <div
                      key={item.type}
                      draggable={isEditing}
                      onDragStart={() => (dragItem.current = item.type)}
                      onDragEnter={() => (dragOverItem.current = item.type)}
                      onDragEnd={handleDrop}
                      className="relative"
                    >
                      {/* Delete button in edit mode */}
                      {isEditing && (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          onClick={() => handleHideItem(item.type)}
                          className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                          aria-label={`הסתר ${item.label}`}
                        >
                          <CloseIcon className="w-4 h-4" />
                        </motion.button>
                      )}

                      <PremiumItemCard
                        label={item.label}
                        icon={item.icon}
                        color={item.color}
                        gradient={item.gradient}
                        onClick={() => handleItemClick(item.type, undefined)}
                        index={index}
                        isEditing={isEditing}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Edit Mode Actions */}
              {isEditing && (
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={() => {
                      sessionStorage.setItem('settings_deep_link', 'add-layout');
                      setActiveScreen('settings');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-cyan-500/30 text-white/70 hover:text-white text-sm font-medium transition-all duration-300"
                  >
                    ⚙️ ניהול פריטים מוסתרים
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Carousel - NOW BELOW quick creation with toggle */}
        <AnimatePresence>
          {!selectedType && !isEditing && !isSearchExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
              className="mt-8"
            >
              {/* Toggle Header for Templates */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  updateSettings({ hideQuickTemplates: !settings.hideQuickTemplates });
                }}
                className="w-full flex items-center justify-between px-4 py-3 mb-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group"
              >
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white/70 group-hover:text-white/90 transition-colors">
                    תבניות מהירות
                  </span>
                </div>
                <motion.span
                  className="text-white/40 text-xs font-medium"
                  animate={{ rotate: settings.hideQuickTemplates ? 0 : 180 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {settings.hideQuickTemplates ? '▼ הצג' : '▲ הסתר'}
                </motion.span>
              </button>

              {/* Collapsible Templates */}
              <AnimatePresence>
                {!settings.hideQuickTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <TemplateCarousel
                      onSelectTemplate={(template: TemplatePreset) => {
                        handleItemClick(template.type, template.prefillData);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Item Creation Form */}
        {selectedType && (
          <ItemCreationForm
            key={selectedType}
            itemType={selectedType}
            onClose={handleCloseForm}
            setActiveScreen={setActiveScreen}
          />
        )}
      </div>

      {/* Voice Input Modal */}
      <Suspense fallback={null}>
        {isVoiceModalOpen && (
          <VoiceInputModal
            isOpen={isVoiceModalOpen}
            onClose={() => setIsVoiceModalOpen(false)}
            setActiveScreen={setActiveScreen}
          />
        )}
      </Suspense>
    </div>
  );
};

export default AddScreen;
