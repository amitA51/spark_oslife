import React, { useState, useEffect, useCallback } from 'react';
import {
  PaletteIcon,
  BrainCircuitIcon,
  SettingsIcon,
  CloudIcon,
  DatabaseIcon,
  DumbbellIcon,
  InfoIcon,
  SparklesIcon,
  TimerIcon,

} from '../components/icons';
import { Screen } from '../types';
import { useSettings } from '../src/contexts/SettingsContext';
import { useUser } from '../src/contexts/UserContext';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import AppearanceSection from '../components/settings/AppearanceSection';
import AISection from '../components/settings/AISection';
import GeneralSection from '../components/settings/GeneralSection';
import IntegrationsSection from '../components/settings/IntegrationsSection';
import DataSection from '../components/settings/DataSection';
import WorkoutSection from '../components/settings/WorkoutSection';
import AboutSection from '../components/settings/AboutSection';
import FocusSection from '../components/settings/FocusSection';


type Status = {
  type: StatusMessageType;
  text: string;
  id: number;
  onUndo?: () => void;
} | null;

type SettingsSectionId = 'appearance' | 'ai' | 'integrations' | 'general' | 'focus' | 'data' | 'workout' | 'about';

const SettingsScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({
  setActiveScreen,
}) => {
  const { settings } = useSettings();
  const { user } = useUser();

  const sections: { id: SettingsSectionId; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'מראה', icon: <PaletteIcon className="w-5 h-5" /> },
    { id: 'general', label: 'כללי', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'focus', label: 'פוקוס', icon: <TimerIcon className="w-5 h-5" /> },

    { id: 'ai', label: 'AI', icon: <BrainCircuitIcon className="w-5 h-5" /> },
    { id: 'integrations', label: 'שילובים', icon: <CloudIcon className="w-5 h-5" /> },
    { id: 'data', label: 'נתונים', icon: <DatabaseIcon className="w-5 h-5" /> },
    { id: 'workout', label: 'אימון', icon: <DumbbellIcon className="w-5 h-5" /> },
    { id: 'about', label: 'אודות', icon: <InfoIcon className="w-5 h-5" /> },
  ];

  const [activeSection, setActiveSection] = useState<SettingsSectionId>('appearance');
  const [statusMessage, setStatusMessage] = useState<Status>(null);
  const [scrolled, setScrolled] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Check for deep link on mount
  useEffect(() => {
    const deepLink = sessionStorage.getItem('settings_deep_link');
    if (deepLink === 'add-layout') {
      setActiveSection('general');
      sessionStorage.removeItem('settings_deep_link');
    }
  }, []);

  // Scroll detection for header blur - using passive listener for better performance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset image error when user changes
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  // Memoized section click handler
  const handleSectionClick = useCallback((sectionId: SettingsSectionId) => {
    setActiveSection(sectionId);
  }, []);

  return (
    <>
      <div className="min-h-screen pb-32">
        {/* Premium Hero Header */}
        <header className={`
          sticky top-0 z-30 transition-all duration-300 -mx-4 px-4
          ${scrolled
            ? 'bg-[var(--bg-primary)]/80 backdrop-blur-2xl border-b border-white/[0.05] py-3'
            : 'bg-transparent py-5'
          }
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="relative">
                <div className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                  bg-gradient-to-br from-[var(--dynamic-accent-start)]/20 to-[var(--dynamic-accent-end)]/20
                  border border-[var(--dynamic-accent-start)]/30
                  shadow-[0_0_20px_var(--dynamic-accent-glow)]
                  transition-all duration-300
                  ${scrolled ? 'w-10 h-10 rounded-xl' : ''}
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
                <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-primary)]" />
              </div>

              <div className={`transition-all duration-300 ${scrolled ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                <h1 className="text-2xl font-bold text-white">
                  {settings.screenLabels?.settings || 'הגדרות'}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {user?.displayName || settings.userName || 'התאם את החוויה שלך'}
                </p>
              </div>
            </div>

            {/* Quick Action */}
            <button className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all">
              <SparklesIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
            </button>
          </div>
        </header>

        {/* Section Navigation - Pills */}
        <div className={`
          sticky z-20 -mx-4 px-4 py-3 transition-all duration-300
          ${scrolled ? 'top-[52px]' : 'top-[88px]'}
          bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)]/95 to-transparent
        `}>
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar snap-x snap-mandatory">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`
                  snap-start flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 font-medium text-sm
                  ${activeSection === section.id
                    ? 'bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white shadow-lg shadow-[var(--dynamic-accent-glow)]/30'
                    : 'bg-white/[0.05] text-[var(--text-secondary)] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white'
                  }
                  animate-premium-fade-in
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className={activeSection === section.id ? 'drop-shadow-lg' : ''}>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="mt-4 px-0 space-y-6">
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'ai' && <AISection />}
          {activeSection === 'general' && <GeneralSection setStatusMessage={setStatusMessage} />}
          {activeSection === 'focus' && <FocusSection />}
          {activeSection === 'integrations' && <IntegrationsSection setStatusMessage={setStatusMessage} />}
          {activeSection === 'data' && <DataSection setActiveScreen={setActiveScreen} setStatusMessage={setStatusMessage} />}
          {activeSection === 'workout' && <WorkoutSection />}
          {activeSection === 'about' && <AboutSection />}
        </main>
      </div>

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
