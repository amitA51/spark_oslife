import React from 'react';
import { BrainCircuitIcon, SparklesIcon, UserIcon } from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import { AiPersonality } from '../../types';
import { defaultMentors } from '../../services/mockData';
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SegmentedControl,
  SettingsInfoBanner,
} from './SettingsComponents';

const inputStyles =
  'w-full bg-white/[0.05] border border-white/[0.1] rounded-xl p-3.5 focus:outline-none focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 text-white placeholder-[var(--text-secondary)] text-sm transition-all';

const AISection: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSettings({ [key]: value } as any);
  };

  return (
    <SettingsSection title="בינה מלאכותית" id="ai">
      {/* Model Selection */}
      <SettingsCard title="מודל ואישיות" icon={<BrainCircuitIcon className="w-5 h-5" />}>
        <SettingsRow
          title="מודל AI"
          description="בחר את המודל שישמש לסיכומים ויצירת תוכן."
        >
          <div className="flex gap-2">
            {([
              { value: 'gemini-2.5-flash', label: 'Flash', desc: 'מהיר', color: 'cyan' },
              { value: 'gemini-2.5-pro', label: 'Pro', desc: 'חכם', color: 'violet' },
            ] as const).map(model => (
              <button
                key={model.value}
                onClick={() => handleSettingChange('aiModel', model.value)}
                className={`
                  flex flex-col items-center px-5 py-3 rounded-xl transition-all
                  ${settings.aiModel === model.value
                    ? 'bg-gradient-to-br from-[var(--dynamic-accent-start)]/20 to-[var(--dynamic-accent-end)]/10 border border-[var(--dynamic-accent-start)]/50 shadow-lg shadow-[var(--dynamic-accent-glow)]/20'
                    : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]'
                  }
                `}
              >
                <span className={`text-sm font-bold ${settings.aiModel === model.value ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                  {model.label}
                </span>
                <span className="text-xs text-[var(--text-secondary)] mt-0.5">{model.desc}</span>
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow title="אישיות העוזר" description="כיצד תרצה שה-AI ידבר אליך?">
          <SegmentedControl
            value={settings.aiPersonality}
            onChange={v => handleSettingChange('aiPersonality', v as AiPersonality)}
            options={[
              { label: 'מעודד', value: 'encouraging' },
              { label: 'תמציתי', value: 'concise' },
              { label: 'רשמי', value: 'formal' },
            ]}
          />
        </SettingsRow>

        {/* Personality Preview */}
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--dynamic-accent-highlight)] font-medium mb-1">דוגמה לתגובה:</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {settings.aiPersonality === 'encouraging' && '🎯 מעולה! אתה בדרך הנכונה. בוא נמשיך יחד לעבר היעד!'}
                {settings.aiPersonality === 'concise' && 'הושלם. 3 משימות נותרו להיום.'}
                {settings.aiPersonality === 'formal' && 'המשימה הושלמה בהצלחה. אנא המשך לפריט הבא ברשימה.'}
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Smart Feed Settings */}
      <SettingsCard title="הגדרות פיד חכם" icon={<SparklesIcon className="w-5 h-5" />}>
        <SettingsRow
          title="ייצור תוכן אוטומטי"
          description="האם לאפשר ל-AI לייצר 'ספארקים' יומיים?"
        >
          <ToggleSwitch
            checked={settings.aiFeedSettings.isEnabled}
            onChange={v =>
              handleSettingChange('aiFeedSettings', {
                ...settings.aiFeedSettings,
                isEnabled: v,
              })
            }
          />
        </SettingsRow>

        {settings.aiFeedSettings.isEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/[0.06]">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                נושאי עניין
              </label>
              <input
                type="text"
                value={settings.aiFeedSettings.topics.join(', ')}
                onChange={e =>
                  handleSettingChange('aiFeedSettings', {
                    ...settings.aiFeedSettings,
                    topics: e.target.value.split(',').map(t => t.trim()),
                  })
                }
                placeholder="פרודוקטיביות, טכנולוגיה, בריאות..."
                className={inputStyles}
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">הפרד נושאים בפסיקים</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                הנחיה מותאמת אישית
              </label>
              <textarea
                value={settings.aiFeedSettings.customPrompt}
                onChange={e =>
                  handleSettingChange('aiFeedSettings', {
                    ...settings.aiFeedSettings,
                    customPrompt: e.target.value,
                  })
                }
                className={`${inputStyles} resize-none`}
                rows={3}
                placeholder="הנחיה מיוחדת ל-AI..."
              />
            </div>
          </div>
        )}
      </SettingsCard>

      {/* Active Mentors */}
      <SettingsCard title="מנטורים פעילים" icon={<UserIcon className="w-5 h-5" />}>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          בחר מאילו מנטורים לקבל ציטוטים בפיד היומי.
        </p>
        <div className="space-y-2">
          {defaultMentors.map(mentor => {
            const isEnabled = settings.enabledMentorIds.includes(mentor.id);
            return (
              <button
                key={mentor.id}
                onClick={() => {
                  let newIds = [...settings.enabledMentorIds];
                  if (isEnabled) {
                    newIds = newIds.filter(id => id !== mentor.id);
                  } else {
                    newIds.push(mentor.id);
                  }
                  handleSettingChange('enabledMentorIds', newIds);
                }}
                className={`
                  w-full flex items-center justify-between p-4 rounded-xl transition-all
                  ${isEnabled
                    ? 'bg-[var(--dynamic-accent-start)]/10 border border-[var(--dynamic-accent-start)]/30'
                    : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-lg
                    ${isEnabled
                      ? 'bg-gradient-to-br from-[var(--dynamic-accent-start)]/30 to-[var(--dynamic-accent-end)]/20'
                      : 'bg-white/[0.05]'
                    }
                  `}>
                    {mentor.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium block">{mentor.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{mentor.description}</span>
                  </div>
                </div>
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center transition-all
                  ${isEnabled
                    ? 'bg-[var(--dynamic-accent-start)] text-white'
                    : 'bg-white/10 text-transparent'
                  }
                `}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsInfoBanner variant="info">
        ה-AI משתמש במידע שלך כדי לספק תוכן מותאם אישית. המידע נשמר בצורה מאובטחת ולא משותף עם צד שלישי.
      </SettingsInfoBanner>
    </SettingsSection>
  );
};

export default AISection;