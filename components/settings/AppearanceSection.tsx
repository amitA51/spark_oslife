import React from 'react';
import { SunIcon, TypeIcon, ImageIcon, ZoomInIcon } from '../../components/icons';
import FileUploader from '../../components/FileUploader';
import { useSettings } from '../../src/contexts/SettingsContext';
import { AppFont, BorderRadius, CardStyle } from '../../types';
import {
  SettingsSection,
  SettingsGroupCard,
  SettingsRow,
  SegmentedControl,
  SettingsInfoBanner,
} from './SettingsComponents';

import ThemeSelector from './ThemeSelector';

const AppearanceSection: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    updateSettings({ [key]: value } as Pick<typeof settings, K>);
  };


  return (
    <SettingsSection title="מראה ותצוגה" id="appearance">
      {/* Theme Selection */}
      <ThemeSelector />

      {/* Interface Design */}
      <SettingsGroupCard title="ממשק ועיצוב" icon={<SunIcon className="w-5 h-5" />}>
        <SettingsRow
          title="עיצוב פינות"
          description="בחר את סגנון הפינות של כרטיסים וכפתורים."
        >
          <SegmentedControl
            value={settings.themeSettings.borderRadius || 'lg'}
            onChange={v =>
              handleSettingChange('themeSettings', {
                ...settings.themeSettings,
                borderRadius: v as BorderRadius,
              })
            }
            options={[
              { label: 'חד', value: 'none' },
              { label: 'עדין', value: 'sm' },
              { label: 'רגיל', value: 'md' },
              { label: 'עגול', value: 'lg' },
              { label: 'בועה', value: 'xl' },
            ]}
          />
        </SettingsRow>
        <SettingsRow title="סגנון כרטיסים" description="שנה את מראה הרכיבים והכרטיסיות.">
          <SegmentedControl
            value={settings.themeSettings.cardStyle}
            onChange={v =>
              handleSettingChange('themeSettings', {
                ...settings.themeSettings,
                cardStyle: v as CardStyle,
              })
            }
            options={[
              { label: 'זכוכית', value: 'glass' },
              { label: 'שטוח', value: 'flat' },
              { label: 'גבול', value: 'bordered' },
            ]}
          />
        </SettingsRow>
        {settings.themeSettings.name === 'Custom' && (
          <SettingsRow title="צבע הדגשה" description="בחר את צבע המבטא הראשי.">
            <div className="relative group">
              <div
                className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-lg overflow-hidden cursor-pointer transition-transform group-hover:scale-105"
                style={{ backgroundColor: settings.themeSettings.accentColor }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              <input
                type="color"
                value={settings.themeSettings.accentColor}
                onChange={e =>
                  handleSettingChange('themeSettings', {
                    ...settings.themeSettings,
                    accentColor: e.target.value,
                  })
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </SettingsRow>
        )}
      </SettingsGroupCard>

      {/* Advanced Customization */}
      <SettingsGroupCard title="התאמה מתקדמת" icon={<ImageIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
        <SettingsRow title="תמונת רקע" description="העלה תמונה שתופיע ברקע האפליקציה.">
          <div className="w-full max-w-xs">
            <FileUploader
              onFileSelect={file =>
                handleSettingChange('themeSettings', {
                  ...settings.themeSettings,
                  backgroundImage: file.url,
                })
              }
              accept="image/*"
              label={settings.themeSettings.backgroundImage ? 'החלף תמונה' : 'העלה תמונה'}
            />
            {settings.themeSettings.backgroundImage && (
              <button
                onClick={() =>
                  handleSettingChange('themeSettings', {
                    ...settings.themeSettings,
                    backgroundImage: undefined,
                  })
                }
                className="text-red-400 text-xs mt-2 hover:text-red-300 w-full text-center transition-colors"
              >
                הסר תמונת רקע
              </button>
            )}
          </div>
        </SettingsRow>
        <SettingsRow title="משקל גופן" description="בחר את עובי הטקסט הראשי.">
          <SegmentedControl
            value={settings.themeSettings.fontWeight || 'normal'}
            onChange={v =>
              handleSettingChange('themeSettings', {
                ...settings.themeSettings,
                fontWeight: v as 'normal' | 'medium' | 'bold',
              })
            }
            options={[
              { label: 'רגיל', value: 'normal' },
              { label: 'בינוני', value: 'medium' },
              { label: 'מודגש', value: 'bold' },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          title="קנה מידה (UI)"
          description="הגדל/הקטן את כל הממשק."
          icon={<ZoomInIcon className="w-4 h-4" />}
        >
          <div className="flex items-center gap-3 w-full max-w-[200px]">
            <span className="text-xs text-[var(--text-secondary)]">80%</span>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.themeSettings.uiScale || 1}
              onChange={e =>
                handleSettingChange('themeSettings', {
                  ...settings.themeSettings,
                  uiScale: parseFloat(e.target.value),
                })
              }
              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--dynamic-accent-start)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">120%</span>
          </div>
        </SettingsRow>
      </SettingsGroupCard>

      {/* Typography & Background */}
      <SettingsGroupCard title="טיפוגרפיה ורקע" icon={<TypeIcon className="w-5 h-5" />} collapsible defaultOpen={false}>
        <SettingsRow title="סוג גופן" description="בחר את הפונט הראשי של האפליקציה.">
          <select
            value={settings.themeSettings.font}
            onChange={e =>
              handleSettingChange('themeSettings', {
                ...settings.themeSettings,
                font: e.target.value as AppFont,
              })
            }
            className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 transition-all cursor-pointer"
          >
            <option value="satoshi">Satoshi (פרימיום) ✨</option>
            <option value="clash-display">Clash Display (כותרות) ✨</option>
            <option value="inter">Inter (נקי)</option>
            <option value="lato">Lato (עגול)</option>
            <option value="rubik">Rubik (מודרני)</option>
            <option value="heebo">Heebo (גיאומטרי)</option>
            <option value="alef">Alef (קלאסי)</option>
            <option value="poppins">Poppins (ידידותי)</option>
          </select>
        </SettingsRow>
        <SettingsRow
          title="גודל גופן"
          description="התאם רק את גודל הטקסט."
        >
          <div className="flex items-center gap-3 w-full max-w-[150px]">
            <span className="text-xs">A</span>
            <input
              type="range"
              min="0.85"
              max="1.2"
              step="0.05"
              value={settings.fontSizeScale}
              onChange={e =>
                handleSettingChange('fontSizeScale', parseFloat(e.target.value))
              }
              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--dynamic-accent-start)]"
            />
            <span className="text-lg">A</span>
          </div>
        </SettingsRow>
        <SettingsRow title="סגנון רקע" description="בחר את סגנון הרקע המועדף.">
          <select
            value={settings.themeSettings.backgroundEffect}
            onChange={e =>
              handleSettingChange('themeSettings', {
                ...settings.themeSettings,
                backgroundEffect: e.target.value as 'particles' | 'dark' | 'off',
              })
            }
            className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--dynamic-accent-start)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/20 transition-all cursor-pointer"
          >
            <option value="particles">חלקיקים אינטראקטיביים</option>
            <option value="dark">מצב כהה (Dark Mode)</option>
            <option value="off">ללא אפקט</option>
          </select>
        </SettingsRow>
      </SettingsGroupCard>

      <SettingsInfoBanner variant="tip">
        <strong>טיפ:</strong> אם רק הטקסט קטן מדי, השתמש בהגדרת "גודל גופן".
        אם כל הממשק קטן, השתמש ב"קנה מידה (UI)".
      </SettingsInfoBanner>
    </SettingsSection>
  );
};

export default AppearanceSection;

