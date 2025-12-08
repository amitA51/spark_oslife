import React from 'react';
import {
  CheckCircleIcon,
  LayoutIcon,
  SwipeIcon,
  HomeIcon,
  PlusIcon,
  TimerIcon,
  VolumeIcon,
  SmartphoneIcon,
  EyeIcon,
  SparklesIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import { AddableType, Screen, SwipeAction } from '../../types';
import { StatusMessageType } from '../../components/StatusMessage';
import ProfileCard from './ProfileCard';
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SegmentedControl,
} from './SettingsComponents';

const ADD_ITEMS: { id: AddableType; label: string; emoji: string }[] = [
  { id: 'task', label: 'משימה', emoji: '✅' },
  { id: 'note', label: 'פתק', emoji: '📝' },
  { id: 'idea', label: 'רעיון', emoji: '💡' },
  { id: 'habit', label: 'הרגל', emoji: '🔄' },
  { id: 'spark', label: 'ספארק', emoji: '⚡' },
  { id: 'link', label: 'קישור', emoji: '🔗' },
  { id: 'book', label: 'ספר', emoji: '📚' },
  { id: 'workout', label: 'אימון', emoji: '💪' },
  { id: 'goal', label: 'פרויקט', emoji: '🎯' },
  { id: 'roadmap', label: 'מפת דרכים', emoji: '🗺️' },
  { id: 'journal', label: 'יומן', emoji: '📔' },
  { id: 'learning', label: 'למידה', emoji: '🎓' },
  { id: 'ticker', label: 'מניה/מטבע', emoji: '📈' },
];

const SWIPE_ACTIONS: { label: string; value: SwipeAction; icon: string }[] = [
  { label: 'השלמה', value: 'complete', icon: '✓' },
  { label: 'דחייה', value: 'postpone', icon: '→' },
  { label: 'מחיקה', value: 'delete', icon: '×' },
  { label: 'כלום', value: 'none', icon: '—' },
];

interface GeneralSectionProps {
  setStatusMessage: (msg: { type: StatusMessageType; text: string; id: number } | null) => void;
}

const GeneralSection: React.FC<GeneralSectionProps> = ({ setStatusMessage }) => {
  const { settings, updateSettings } = useSettings();

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSettings({ [key]: value } as any);
  };

  return (
    <SettingsSection title="כללי וטיימר" id="general">
      <ProfileCard setStatusMessage={setStatusMessage} />

      {/* User Experience */}
      <SettingsCard title="חווית משתמש" icon={<SparklesIcon className="w-5 h-5" />}>
        <SettingsRow
          title="אפקטים קוליים"
          description="הפעל צלילי משוב בעת לחיצות ואירועים."
          icon={<VolumeIcon className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={settings.enableSounds}
            onChange={v => handleSettingChange('enableSounds', v)}
          />
        </SettingsRow>
        <SettingsRow
          title="משוב רטט (Haptics)"
          description="רטט עדין בפעולות ממשק."
          icon={<SmartphoneIcon className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={settings.hapticFeedback}
            onChange={v => handleSettingChange('hapticFeedback', v)}
          />
        </SettingsRow>
        <SettingsRow
          title="צפיפות תצוגה"
          description="בחר כמה צפוף או מרווח להיות בכל המסכים."
          icon={<EyeIcon className="w-4 h-4" />}
        >
          <SegmentedControl
            value={settings.uiDensity}
            onChange={v => handleSettingChange('uiDensity', v)}
            options={[
              { label: 'דחוס', value: 'compact' },
              { label: 'רגיל', value: 'comfortable' },
              { label: 'מרווח', value: 'spacious' },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          title="עוצמת אנימציות"
          description="שנה כמה חזקות וחיות יהיו האנימציות בממשק."
        >
          <SegmentedControl
            value={settings.animationIntensity}
            onChange={v => handleSettingChange('animationIntensity', v)}
            options={[
              { label: 'כבוי', value: 'off' },
              { label: 'עדין', value: 'subtle' },
              { label: 'רגיל', value: 'default' },
              { label: 'מלא', value: 'full' },
            ]}
          />
        </SettingsRow>
      </SettingsCard>

      {/* Visual Settings for Enhanced Components */}
      <SettingsCard title="הגדרות ויזואליות" icon={<EyeIcon className="w-5 h-5" />}>
        <SettingsRow
          title="הצג רצפים"
          description="הצג מונה ימים רצופים בהרגלים והכרת תודה."
        >
          <ToggleSwitch
            checked={settings.visualSettings?.showStreaks ?? true}
            onChange={v => handleSettingChange('visualSettings', {
              ...settings.visualSettings,
              showStreaks: v
            })}
          />
        </SettingsRow>
        <SettingsRow
          title="הצג לגנדות"
          description="הצג מקרא בגרפים ותרשימים."
        >
          <ToggleSwitch
            checked={settings.visualSettings?.showLegends ?? true}
            onChange={v => handleSettingChange('visualSettings', {
              ...settings.visualSettings,
              showLegends: v
            })}
          />
        </SettingsRow>
        <SettingsRow
          title="הצג סרגל התקדמות"
          description="סרגל התקדמות בהודעות שנסגרות אוטומטית."
        >
          <ToggleSwitch
            checked={settings.visualSettings?.showProgressBars ?? true}
            onChange={v => handleSettingChange('visualSettings', {
              ...settings.visualSettings,
              showProgressBars: v
            })}
          />
        </SettingsRow>
        <SettingsRow
          title="סגנון ספינר טעינה"
          description="בחר את סגנון אנימציית הטעינה."
        >
          <SegmentedControl
            value={settings.visualSettings?.spinnerVariant ?? 'default'}
            onChange={v => handleSettingChange('visualSettings', {
              ...settings.visualSettings,
              spinnerVariant: v
            })}
            options={[
              { label: 'רגיל', value: 'default' },
              { label: 'נקודות', value: 'dots' },
              { label: 'פעימה', value: 'pulse' },
              { label: 'מסלול', value: 'orbit' },
            ]}
          />
        </SettingsRow>
      </SettingsCard>

      {/* Navigation & Display */}
      <SettingsCard title="ניווט ותצוגה" icon={<LayoutIcon className="w-5 h-5" />}>
        <SettingsRow
          title="מסך ברירת מחדל"
          description="המסך שייפתח בהפעלת האפליקציה."
          icon={<HomeIcon className="w-4 h-4" />}
        >
          <select
            value={settings.defaultScreen}
            onChange={e => handleSettingChange('defaultScreen', e.target.value as Screen)}
            className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--dynamic-accent-start)] transition-all cursor-pointer"
          >
            {Object.entries(settings.screenLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </SettingsRow>
        <SettingsRow title="תצוגת פיד" description="בחר כיצד להציג את הפריטים בפיד.">
          <SegmentedControl
            value={settings.feedViewMode}
            onChange={v => handleSettingChange('feedViewMode', v)}
            options={[
              { label: 'רשימה', value: 'list' },
              { label: 'ויזואלי', value: 'visual' },
            ]}
          />
        </SettingsRow>

        <div className="border-t border-white/[0.06] pt-4 mt-4">
          <h4 className="text-sm font-bold text-white mb-2">סרגל ניווט תחתון</h4>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            בחר את 4 המסכים שיופיעו בסרגל הניווט (לפי הסדר).
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(settings.screenLabels).map(([key, label]) => {
              if (key === 'add' || key === 'login' || key === 'signup') return null;
              const isSelected = settings.navBarLayout.includes(key as Screen);
              const index = settings.navBarLayout.indexOf(key as Screen);

              return (
                <button
                  key={key}
                  onClick={() => {
                    let newLayout = [...settings.navBarLayout];
                    if (isSelected) {
                      newLayout = newLayout.filter(k => k !== key);
                    } else {
                      if (newLayout.filter(k => k !== 'add').length >= 4) {
                        newLayout.pop();
                      }
                      newLayout.push(key as Screen);
                    }
                    handleSettingChange('navBarLayout', newLayout);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white shadow-lg shadow-[var(--dynamic-accent-glow)]/20'
                      : 'bg-white/[0.05] text-[var(--text-secondary)] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white'
                    }
                  `}
                >
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsCard>

      {/* Swipe Actions */}
      <SettingsCard title="פעולות החלקה" icon={<SwipeIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          הגדר מה קורה כאשר אתה מחליק משימה ימינה או שמאלה.
        </p>
        <SettingsRow title="החלקה ימינה →" description="פעולה לביצוע בהחלקה ימינה.">
          <div className="flex gap-2">
            {SWIPE_ACTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSettingChange('swipeRightAction', opt.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${settings.swipeRightAction === opt.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.1]'
                  }
                `}
              >
                <span className="text-xs">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow title="← החלקה שמאלה" description="פעולה לביצוע בהחלקה שמאלה.">
          <div className="flex gap-2">
            {SWIPE_ACTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSettingChange('swipeLeftAction', opt.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${settings.swipeLeftAction === opt.value
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.1]'
                  }
                `}
              >
                <span className="text-xs">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsCard>

      {/* Home Screen Layout */}
      <SettingsCard title="מסך הבית (היום)" icon={<HomeIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          בחר אילו אזורים יוצגו במסך הבית.
        </p>
        <div className="space-y-2">
          {settings.homeScreenLayout.map(component => (
            <div
              key={component.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all"
            >
              <div>
                <span className="text-white font-medium">{settings.sectionLabels[component.id] || component.id}</span>
                <span className={`text-xs mr-2 ${component.isVisible ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
                  {component.isVisible ? 'מוצג' : 'מוסתר'}
                </span>
              </div>
              <ToggleSwitch
                checked={component.isVisible}
                onChange={checked => {
                  const newLayout = settings.homeScreenLayout.map(c =>
                    c.id === component.id ? { ...c, isVisible: checked } : c
                  );
                  handleSettingChange('homeScreenLayout', newLayout);
                }}
              />
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Add Menu */}
      <SettingsCard title="תפריט הוספה" icon={<PlusIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          בחר אילו פריטים יופיעו במסך ההוספה.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ADD_ITEMS.map(item => {
            const isActive = settings.addScreenLayout.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  let newLayout = [...settings.addScreenLayout];
                  if (isActive) {
                    newLayout = newLayout.filter(t => t !== item.id);
                  } else {
                    newLayout.push(item.id);
                  }
                  handleSettingChange('addScreenLayout', newLayout);
                }}
                className={`
                  flex items-center justify-between p-3 rounded-xl transition-all
                  ${isActive
                    ? 'bg-[var(--dynamic-accent-start)]/15 border border-[var(--dynamic-accent-start)]/40 text-white'
                    : 'bg-white/[0.03] border border-transparent text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-white'
                  }
                `}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span>{item.emoji}</span>
                  {item.label}
                </span>
                {isActive && (
                  <CheckCircleIcon className="w-4 h-4 text-[var(--dynamic-accent-start)]" />
                )}
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Focus Timer */}
      <SettingsCard title="טיימר פוקוס" icon={<TimerIcon className="w-5 h-5" />}>
        <SettingsRow title="זמן עבודה (דקות)" description="משך סשן עבודה רגיל.">
          <input
            type="number"
            value={settings.pomodoroSettings.workDuration}
            onChange={e =>
              handleSettingChange('pomodoroSettings', {
                ...settings.pomodoroSettings,
                workDuration: parseInt(e.target.value),
              })
            }
            className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-xl p-2.5 text-center text-white focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 outline-none transition-all"
          />
        </SettingsRow>
        <SettingsRow title="הפסקה קצרה (דקות)" description="משך המנוחה בין סשנים.">
          <input
            type="number"
            value={settings.pomodoroSettings.shortBreak}
            onChange={e =>
              handleSettingChange('pomodoroSettings', {
                ...settings.pomodoroSettings,
                shortBreak: parseInt(e.target.value),
              })
            }
            className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-xl p-2.5 text-center text-white focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 outline-none transition-all"
          />
        </SettingsRow>
        <SettingsRow title="הפעלה אוטומטית" description="התחל את הסשן הבא באופן אוטומטי.">
          <ToggleSwitch
            checked={settings.intervalTimerSettings.autoStartNext}
            onChange={v =>
              handleSettingChange('intervalTimerSettings', {
                ...settings.intervalTimerSettings,
                autoStartNext: v,
              })
            }
          />
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>
  );
};

export default GeneralSection;