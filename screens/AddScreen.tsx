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
import QuickCreateFAB from '../components/add/QuickCreateFAB';
import TemplateCarousel, { TemplatePreset } from '../components/add/TemplateCarousel';
import { AddScreenSkeleton } from '../components/add';
import { useAISuggestions } from '../hooks/add/useAISuggestions';

const VoiceInputModal = lazy(() => import('../components/VoiceInputModal'));

interface AddScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const allItemTypes: { type: AddableType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'spark', label: 'ספארק', icon: <SparklesIcon />, color: 'var(--accent-start)' },
  { type: 'idea', label: 'רעיון', icon: <LightbulbIcon />, color: 'var(--warning)' },
  { type: 'note', label: 'פתק', icon: <ClipboardListIcon />, color: '#FBBF24' },
  { type: 'task', label: 'משימה', icon: <CheckCircleIcon />, color: 'var(--success)' },
  { type: 'link', label: 'קישור', icon: <LinkIcon />, color: '#60A5FA' },
  { type: 'learning', label: 'למידה', icon: <SummarizeIcon />, color: '#38BDF8' },
  { type: 'journal', label: 'יומן', icon: <UserIcon />, color: '#F0ABFC' },
  { type: 'book', label: 'ספר', icon: <BookOpenIcon />, color: '#A78BFA' },
  { type: 'workout', label: 'אימון', icon: <DumbbellIcon />, color: '#F472B6' },
  { type: 'roadmap', label: 'מפת דרכים', icon: <RoadmapIcon />, color: '#3B82F6' },
  { type: 'ticker', label: 'מניה / מטבע', icon: <ChartBarIcon />, color: 'var(--text-secondary)' },
];

const AddItemButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  color: string;
  style?: React.CSSProperties;
  isEditing?: boolean;
}> = ({ icon, label, onClick, color, style, isEditing }) => (
  <button
    onClick={onClick}
    className={`
      group relative overflow-hidden
      bg-gradient-to-br from-white/[0.06] to-white/[0.02]
      backdrop-blur-xl
      border border-white/[0.08]
      rounded-[1.25rem]
      p-3 sm:p-4
      flex flex-col items-center justify-center gap-2.5
      aspect-square
      transition-all duration-300 ease-out
      ${isEditing
        ? 'cursor-grab active:cursor-grabbing opacity-50 scale-95'
        : 'hover:scale-[1.04] hover:-translate-y-1 hover:border-white/[0.15] hover:shadow-[0_12px_40px_-10px_var(--glow-color)] active:scale-[0.98]'
      }
    `}
    aria-label={`הוסף ${label}`}
    style={{
      ...style,
      '--glow-color': `${color}60`,
    } as React.CSSProperties}
    disabled={isEditing}
  >
    {/* Glass shine effect at top */}
    <div
      className="absolute top-0 left-0 right-0 h-px pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.15) 50%, transparent 90%)',
      }}
    />

    {/* Gradient overlay on hover */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
      style={{
        background: `radial-gradient(circle at 50% 30%, ${color}15 0%, transparent 70%)`,
      }}
    />

    {/* Icon Container */}
    <div
      className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
      style={{
        background: `linear-gradient(135deg, ${color}25, ${color}15)`,
        boxShadow: `0 0 0 1px ${color}25, 0 4px 12px ${color}20`,
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 20px ${color}50, inset 0 0 10px ${color}30`,
        }}
      />

      {/* Icon */}
      <div
        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center relative z-10 transition-all duration-300"
        style={{ color }}
      >
        {React.isValidElement<{ className?: string }>(icon)
          ? React.cloneElement(icon, {
            ...icon.props,
            className: 'w-full h-full',
          })
          : icon}
      </div>
    </div>

    {/* Label */}
    <span
      className="relative z-10 font-semibold text-white/90 text-[10px] sm:text-[11px] leading-tight text-center tracking-wide group-hover:text-white transition-colors duration-300"
    >
      {label}
    </span>

    {/* Bottom accent indicator */}
    <div
      className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] group-hover:w-8 transition-all duration-400 rounded-full"
      style={{
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }}
    />
  </button>
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
  const [prefilledData, setPrefilledData] = useState<Partial<Record<string, unknown>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);

  const dragItem = useRef<AddableType | null>(null);
  const dragOverItem = useRef<AddableType | null>(null);
  // Used for forcing re-render after drag operations
  const [, setForceRender] = useState(0);

  // Simulate initial loading for premium feel
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts for power users
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Escape to close form
    if (e.key === 'Escape' && selectedType) {
      e.preventDefault();
      handleCloseForm();
      return;
    }

    // Show keyboard hints with ?
    if (e.key === '?' && !selectedType) {
      e.preventDefault();
      setShowKeyboardHint(prev => !prev);
      return;
    }

    // Quick create shortcuts (1-9 for item types)
    if (!selectedType && !isEditing && e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (index < addScreenLayout.length) {
        e.preventDefault();
        const type = addScreenLayout[index];
        if (type) {
          handleItemClick(type, undefined);
        }
      }
      return;
    }

    // Cmd/Ctrl + N for new item (focus search)
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      setIsSearchExpanded(true);
      return;
    }

    // Cmd/Ctrl + E for edit mode
    if ((e.metaKey || e.ctrlKey) && e.key === 'e' && !selectedType) {
      e.preventDefault();
      setIsEditing(prev => !prev);
      return;
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

  const handleItemClick = (type: AddableType, data?: any) => {
    triggerHaptic('light');
    setSelectedType(type);
    if (data) {
      setPrefilledData(data);
    }
  };

  const handleCloseForm = () => {
    setSelectedType(null);
    setPrefilledData(null);
  };

  // Show skeleton during initial load
  if (isLoading) {
    return <AddScreenSkeleton />;
  }

  return (
    <div className="screen-shell pb-24 relative overflow-hidden animate-in fade-in-0 duration-500">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ backgroundColor: 'var(--dynamic-accent-glow)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ backgroundColor: 'var(--dynamic-accent-glow)', animationDelay: '1s' }}
        />
        {/* Additional ambient effects */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[var(--dynamic-accent-color)] rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-[var(--dynamic-accent-color)] rounded-full blur-2xl opacity-30" />
      </div>

      {/* Keyboard Shortcuts Hint Modal */}
      {showKeyboardHint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setShowKeyboardHint(false)}
        >
          <div
            className="bg-[var(--color-cosmos-depth)] border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4 text-center">⌨️ קיצורי מקלדת</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/60">יצירה מהירה</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-cyan-400">1-9</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">חיפוש חדש</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-cyan-400">⌘N</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">מצב עריכה</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-cyan-400">⌘E</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">סגירת טופס</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-cyan-400">Esc</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">הצג/הסתר עזרה</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-cyan-400">?</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowKeyboardHint(false)}
              className="mt-6 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium text-sm"
            >
              הבנתי!
            </button>
          </div>
        </div>
      )}

      {/* Smart Search Bar */}
      {!isEditing && (
        <SmartSearchBar
          onCreateItem={handleItemClick}
          onVoiceInput={() => setIsVoiceModalOpen(true)}
          isExpanded={isSearchExpanded}
          onToggleExpand={setIsSearchExpanded}
        />
      )}

      {/* Header with Edit button */}
      <header className="mb-6 sm:mb-8 relative">
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-4">
          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-[var(--text-secondary)] hover:text-white transition-all duration-300 overflow-hidden"
            aria-label={isEditing ? 'סיים עריכה' : 'ערוך פריסה'}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-violet-500/0 group-hover:from-cyan-500/10 group-hover:to-violet-500/10 transition-all" />
            {isEditing ? (
              <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
            ) : (
              <EditIcon className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
            )}
          </button>

          {/* Premium Title Badge with Time Greeting */}
          <div
            className="absolute left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border backdrop-blur-md"
            style={{
              background: 'var(--dynamic-accent-color)',
              borderColor: 'var(--dynamic-accent-start)',
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: 'var(--dynamic-accent-start)' }}
            >
              ✨ {timeGreeting}
            </span>
          </div>

          {/* Keyboard Hint Button */}
          <button
            onClick={() => setShowKeyboardHint(true)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all duration-300"
            aria-label="קיצורי מקלדת"
          >
            <span className="text-sm">⌨️</span>
          </button>
        </div>

        {/* Title - Only show if search not expanded */}
        {!isSearchExpanded && (
          <div className="text-center px-4 animate-in fade-in-0 slide-in-from-top-2 duration-500">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">
              <span
                className="drop-shadow-[0_0_20px_var(--dynamic-accent-glow)]"
                style={{ color: 'var(--dynamic-accent-start)' }}
              >
                מה להוסיף?
              </span>
            </h1>
            <p className="text-sm text-white/60 font-medium">
              {motivationalMessage}
            </p>
          </div>
        )}
      </header>

      {/* Template Carousel - Quick Templates */}
      {!selectedType && !isEditing && !isSearchExpanded && (
        <TemplateCarousel
          onSelectTemplate={(template: TemplatePreset) => {
            handleItemClick(template.type, template.prefillData);
          }}
        />
      )}

      {/* Premium Category Grid */}
      <div
        className={`transition-all duration-500 ease-out ${selectedType ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          } ${isSearchExpanded ? 'mt-2' : 'mt-6'} px-3 sm:px-4`}
      >
        {/* Section Title */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--dynamic-accent-start)' }}
          >
            ✦ יצירה מהירה
          </h2>
          <span className="text-[10px] text-white/40">גרור לסידור מחדש →</span>
        </div>

        <div
          className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3 max-w-4xl mx-auto"
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
                className={`relative transition-transform duration-300 ${dragItem.current === item.type ? 'dragging-item' : ''}`}
              >
                {isEditing && (
                  <button
                    onClick={() => handleHideItem(item.type)}
                    className="absolute -top-2 -right-2 z-10 bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-transform hover:scale-110 active:scale-90"
                    aria-label={`הסתר ${item.label}`}
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                <AddItemButton
                  label={item.label}
                  icon={item.icon}
                  color={item.color}
                  onClick={() => handleItemClick(item.type, undefined)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  isEditing={isEditing}
                />
              </div>
            );
          })}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500 px-4">
          <button
            onClick={() => {
              sessionStorage.setItem('settings_deep_link', 'add-layout');
              setActiveScreen('settings');
            }}
            className="group relative px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-[var(--dynamic-accent-start)]/30 text-white/80 hover:text-white text-sm font-medium transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, var(--dynamic-accent-color), transparent)',
              }}
            />
            <span className="relative z-10">⚙️ ניהול פריטים מוסתרים</span>
          </button>
        </div>
      )}

      {/* Quick Create FAB */}
      {!isEditing && !selectedType && (
        <QuickCreateFAB
          onCreateItem={(type) => handleItemClick(type, undefined)}
          suggestedTypes={addScreenLayout.slice(0, 5)}
        />
      )}

      {selectedType && (
        <ItemCreationForm
          key={selectedType}
          itemType={selectedType}
          onClose={handleCloseForm}
          setActiveScreen={setActiveScreen}
        />
      )}

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
