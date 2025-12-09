import React from 'react';
import ToggleSwitch from '../../components/ToggleSwitch';
import ExerciseLibraryManager from '../../components/ExerciseLibraryManager';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SegmentedControl,
} from './SettingsComponents';

const WorkoutSection: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    updateSettings({ [key]: value } as Pick<typeof settings, K>);
  };

  return (
    <SettingsSection title="הגדרות אימון" id="workout">
      <SettingsCard title="הגדרות בסיסיות">
        <SettingsRow
          title="זמן מנוחה ברירת מחדל (שניות)"
          description="כמה זמן לנוח בין סטים."
        >
          <SegmentedControl
            value={String(settings.workoutSettings.defaultRestTime)}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                defaultRestTime: Number(v),
              })
            }
            options={[
              { label: '30', value: '30' },
              { label: '60', value: '60' },
              { label: '90', value: '90' },
              { label: '120', value: '120' },
            ]}
          />
        </SettingsRow>

        <SettingsRow
          title="מספר סטים ברירת מחדל"
          description="כמה סטים בכל תרגיל חדש."
        >
          <SegmentedControl
            value={String(settings.workoutSettings.defaultSets)}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                defaultSets: Number(v),
              })
            }
            options={[
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
              { label: '5', value: '5' },
            ]}
          />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="חווית משתמש">
        <SettingsRow title="צלילים" description="השמע צלילי משוב במהלך האימון.">
          <ToggleSwitch
            checked={settings.workoutSettings.soundEnabled}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                soundEnabled: v,
              })
            }
          />
        </SettingsRow>

        <SettingsRow
          title="רטט (Haptics)"
          description="רטט עדין בסיום סט או מנוחה."
        >
          <ToggleSwitch
            checked={settings.workoutSettings.hapticsEnabled}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                hapticsEnabled: v,
              })
            }
          />
        </SettingsRow>

        <SettingsRow
          title="שמור מסך דלוק"
          description="מנע כיבוי מסך במהלך אימון."
        >
          <ToggleSwitch
            checked={settings.workoutSettings.keepAwake}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                keepAwake: v,
              })
            }
          />
        </SettingsRow>

        <SettingsRow
          title="מצב OLED"
          description="רקע כהה לחיסכון בסוללה במסכי OLED."
        >
          <ToggleSwitch
            checked={settings.workoutSettings.oledMode}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                oledMode: v,
              })
            }
          />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="מטרות ואימום">
        <SettingsRow
          title="מטרת אימון ברירת מחדל"
          description="סוג האימון המועדף עליך."
        >
          <select
            value={settings.workoutSettings.defaultWorkoutGoal}
            onChange={e =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                defaultWorkoutGoal: e.target.value as 'strength' | 'hypertrophy' | 'endurance' | 'flexibility' | 'general',
              })
            }
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-lg p-2 focus:outline-none focus:border-[var(--dynamic-accent-start)]"
          >
            <option value="strength">כוח (Strength)</option>
            <option value="hypertrophy">היפרטרופיה (גודל שריר)</option>
            <option value="endurance">סיבולת</option>
            <option value="flexibility">גמישות</option>
            <option value="general">כללי</option>
          </select>
        </SettingsRow>

        <SettingsRow
          title="חימום (Warmup)"
          description="מה לעשות לפני תחילת האימון."
        >
          <SegmentedControl
            value={settings.workoutSettings.warmupPreference}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                warmupPreference: v as 'always' | 'never' | 'ask',
              })
            }
            options={[
              { label: 'תמיד', value: 'always' },
              { label: 'שאל', value: 'ask' },
              { label: 'אף פעם', value: 'never' },
            ]}
          />
        </SettingsRow>

        <SettingsRow
          title="קירור (Cooldown)"
          description="מה לעשות בסיום האימון."
        >
          <SegmentedControl
            value={settings.workoutSettings.cooldownPreference}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                cooldownPreference: v as 'always' | 'never' | 'ask',
              })
            }
            options={[
              { label: 'תמיד', value: 'always' },
              { label: 'שאל', value: 'ask' },
              { label: 'אף פעם', value: 'never' },
            ]}
          />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="מעקב משקל">
        <SettingsRow
          title="עקוב אחר משקל גוף"
          description="שמור והצג היסטוריית משקל הגוף שלך."
        >
          <ToggleSwitch
            checked={settings.workoutSettings.trackBodyWeight}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                trackBodyWeight: v,
              })
            }
          />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="תזכורות">
        <SettingsRow
          title="תזכורות לאימון"
          description="קבל תזכורת יומית לאמן."
        >
          <ToggleSwitch
            checked={settings.workoutSettings.workoutRemindersEnabled}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                workoutRemindersEnabled: v,
              })
            }
          />
        </SettingsRow>

        {settings.workoutSettings.workoutRemindersEnabled && (
          <>
            <div className="border-t border-[var(--border-primary)] pt-4">
              <SettingsRow title="שעת תזכורת" description="באיזו שעה לשלוח תזכורת.">
                <input
                  type="time"
                  value={settings.workoutSettings.workoutReminderTime}
                  onChange={e =>
                    handleSettingChange('workoutSettings', {
                      ...settings.workoutSettings,
                      workoutReminderTime: e.target.value,
                    })
                  }
                  className="glass-input w-32 rounded-lg p-2 focus:outline-none text-primary text-sm"
                />
              </SettingsRow>
            </div>

            <div className="border-t border-[var(--border-primary)] pt-4">
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-3">
                ימים לתזכורת
              </label>
              <div className="flex gap-2 flex-wrap">
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, i) => {
                  const isSelected = settings.workoutSettings.reminderDays?.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const currentDays = settings.workoutSettings.reminderDays || [];
                        const newDays = isSelected
                          ? currentDays.filter(d => d !== i)
                          : [...currentDays, i];
                        handleSettingChange('workoutSettings', {
                          ...settings.workoutSettings,
                          reminderDays: newDays,
                        });
                      }}
                      className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${isSelected
                        ? 'bg-[var(--dynamic-accent-start)] text-white shadow-lg'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-white/10'
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <SettingsRow
          title="תזכורות מים"
          description="זכור לשתות במהלך האימון."
        >
          <ToggleSwitch
            checked={settings.workoutSettings.waterReminderEnabled}
            onChange={v =>
              handleSettingChange('workoutSettings', {
                ...settings.workoutSettings,
                waterReminderEnabled: v,
              })
            }
          />
        </SettingsRow>

        {settings.workoutSettings.waterReminderEnabled && (
          <SettingsRow title="תדירות (דקות)" description="כל כמה זמן להזכיר.">
            <SegmentedControl
              value={String(settings.workoutSettings.waterReminderInterval)}
              onChange={v =>
                handleSettingChange('workoutSettings', {
                  ...settings.workoutSettings,
                  waterReminderInterval: Number(v),
                })
              }
              options={[
                { label: '10', value: '10' },
                { label: '15', value: '15' },
                { label: '20', value: '20' },
                { label: '30', value: '30' },
              ]}
            />
          </SettingsRow>
        )}
      </SettingsCard>

      <SettingsCard title="ספריית תרגילים אישית">
        <ExerciseLibraryManager />
      </SettingsCard>
    </SettingsSection>
  );
};

export default WorkoutSection;