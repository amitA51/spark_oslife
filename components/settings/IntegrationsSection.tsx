import React, { useState } from 'react';
import {
  CloudIcon,
  DownloadIcon,
  RefreshIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  LinkIcon,
  CheckIcon,
} from '../../components/icons';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSettings } from '../../src/contexts/SettingsContext';
import { useUser } from '../../src/contexts/UserContext';
import { signInWithGoogle, hasGoogleApiAccess, clearGoogleAccessToken } from '../../services/authService';
import * as googleDriveService from '../../services/googleDriveService';
import * as dataService from '../../services/dataService';
import * as notifications from '../../services/notificationsService';
import { StatusMessageType } from '../../components/StatusMessage';
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SegmentedControl,
  SettingsInfoBanner,
} from './SettingsComponents';
import GoogleTasksSection from './GoogleTasksSection';
import WebhooksSection from './WebhooksSection';

interface IntegrationsSectionProps {
  setStatusMessage: (msg: { type: StatusMessageType; text: string; id: number } | null) => void;
}

const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({ setStatusMessage }) => {
  const { settings, updateSettings } = useSettings();
  const { isAuthenticated } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // Google connection status based on Firebase Auth + API access
  const isGoogleConnected = isAuthenticated && hasGoogleApiAccess();

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSettings({ [key]: value } as any);
  };

  const handleConnectGoogle = async () => {
    setIsGoogleConnecting(true);
    try {
      await signInWithGoogle();
      setStatusMessage({ type: 'success', text: 'התחברת ל-Google בהצלחה!', id: Date.now() });
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setStatusMessage({ type: 'error', text: 'שגיאה בהתחברות ל-Google.', id: Date.now() });
    } finally {
      setIsGoogleConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      clearGoogleAccessToken();
      setStatusMessage({ type: 'success', text: 'ניתוק מ-Google Calendar/Drive בוצע בהצלחה.', id: Date.now() });
    } catch (error) {
      console.error('Google Disconnect Error:', error);
      setStatusMessage({ type: 'error', text: 'שגיאה בניתוק.', id: Date.now() });
    }
  };

  const handleSync = async (direction: 'upload' | 'download') => {
    if (!isGoogleConnected) {
      setStatusMessage({ type: 'error', text: 'יש להתחבר ל-Google תחילה.', id: Date.now() });
      return;
    }

    setIsSyncing(true);
    try {
      let fileId = settings.googleDriveBackupId;

      if (!fileId) {
        const existingFileId = await googleDriveService.findBackupFile();
        if (existingFileId) {
          fileId = existingFileId;
          handleSettingChange('googleDriveBackupId', fileId);
        }
      }

      if (direction === 'upload') {
        const json = await dataService.exportAllData();
        const newFileId = await googleDriveService.uploadBackup(json, fileId);
        if (!fileId) handleSettingChange('googleDriveBackupId', newFileId);

        const now = new Date().toISOString();
        handleSettingChange('lastSyncTime', now);
        setStatusMessage({ type: 'success', text: 'הגיבוי הועלה בהצלחה ל-Drive.', id: Date.now() });
      } else {
        if (!fileId) {
          setStatusMessage({ type: 'error', text: 'לא נמצא קובץ גיבוי ב-Drive.', id: Date.now() });
          return;
        }
        const data = await googleDriveService.downloadBackup(fileId);
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

        await dataService.importAllData(jsonString);
        window.location.reload();
      }
    } catch (error) {
      console.error('Sync error:', error);
      setStatusMessage({ type: 'error', text: 'שגיאה בסנכרון הנתונים.', id: Date.now() });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    handleSettingChange('notificationsEnabled', enabled);
    if (enabled && notificationPermission === 'default')
      setNotificationPermission(await notifications.requestPermission());
  };

  return (
    <SettingsSection title="שילובים והתראות" id="integrations">
      {/* Google Integration */}
      <SettingsCard title="חשבון Google" icon={<CloudIcon className="w-5 h-5" />}>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-4">
            {/* Google Logo */}
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">
                {isGoogleConnected ? 'מחובר' : 'לא מחובר'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {isGoogleConnected
                  ? 'Calendar & Drive מסונכרנים'
                  : 'התחבר לסנכרון יומן וגיבוי'}
              </p>
            </div>
          </div>

          {isGoogleConnected ? (
            <button
              onClick={handleDisconnectGoogle}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
            >
              נתק חיבור
            </button>
          ) : (
            <button
              onClick={handleConnectGoogle}
              disabled={isGoogleConnecting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white text-sm font-semibold hover:brightness-110 shadow-lg shadow-[var(--dynamic-accent-glow)]/30 transition-all disabled:opacity-50"
            >
              {isGoogleConnecting ? 'מתחבר...' : 'התחבר'}
            </button>
          )}
        </div>
      </SettingsCard>

      {/* Cloud Sync */}
      <SettingsCard title="סנכרון ענן" icon={<CloudIcon className="w-5 h-5" />}>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          סנכרן את הנתונים שלך ל-Google Drive כדי לגשת אליהם ממכשירים אחרים.
        </p>

        {isGoogleConnected ? (
          <div className="space-y-4">
            {/* Sync Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSync('upload')}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] hover:border-[var(--dynamic-accent-start)]/50 transition-all disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshIcon className="w-5 h-5 animate-spin text-[var(--dynamic-accent-start)]" />
                ) : (
                  <CloudIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                )}
                <span className="text-white font-medium text-sm">גיבוי לענן</span>
              </button>
              <button
                onClick={() => handleSync('download')}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] hover:border-[var(--dynamic-accent-start)]/50 transition-all disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshIcon className="w-5 h-5 animate-spin text-[var(--dynamic-accent-start)]" />
                ) : (
                  <DownloadIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                )}
                <span className="text-white font-medium text-sm">שחזור מענן</span>
              </button>
            </div>

            {/* Last Sync Time */}
            {settings.lastSyncTime && (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>סנכרון אחרון: {new Date(settings.lastSyncTime).toLocaleString('he-IL')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.1]">
            <CloudIcon className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[var(--text-secondary)]">
              התחבר ל-Google כדי להשתמש בסנכרון ענן
            </p>
          </div>
        )}
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard title="התראות" icon={<BellIcon className="w-5 h-5" />}>
        <SettingsRow
          title="אפשר התראות"
          description="קבל התראות ועדכונים מהאפליקציה."
        >
          <ToggleSwitch
            checked={settings.notificationsEnabled}
            onChange={handleNotificationToggle}
          />
        </SettingsRow>

        {settings.notificationsEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/[0.06]">
            {/* Permission Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-[var(--text-secondary)]">סטטוס הרשאה:</span>
              <span
                className={`
                  text-xs font-bold px-3 py-1 rounded-full
                  ${notificationPermission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }
                `}
              >
                {notificationPermission === 'granted' ? 'פעיל ✓' : 'נדרשת הרשאה'}
              </span>
            </div>

            <SettingsRow title="תזכורות למשימות" description="קבל התראה לפני שעת היעד.">
              <ToggleSwitch
                checked={settings.taskRemindersEnabled}
                onChange={val => handleSettingChange('taskRemindersEnabled', val)}
              />
            </SettingsRow>

            {settings.taskRemindersEnabled && (
              <SettingsRow
                title="זמן לפני התראה"
                description="כמה זמן לפני לקבל את התזכורת."
                icon={<ClockIcon className="w-4 h-4" />}
              >
                <SegmentedControl
                  value={settings.taskReminderTime}
                  onChange={val => handleSettingChange('taskReminderTime', val)}
                  options={[
                    { label: '5 דק׳', value: '5' },
                    { label: '15 דק׳', value: '15' },
                    { label: '30 דק׳', value: '30' },
                    { label: 'שעה', value: '60' },
                  ]}
                />
              </SettingsRow>
            )}

            <SettingsRow
              title="תזכורות להרגלים"
              description="קבל התראות על הרגלים שלא הושלמו."
            >
              <ToggleSwitch
                checked={settings.enableHabitReminders}
                onChange={val => handleSettingChange('enableHabitReminders', val)}
              />
            </SettingsRow>
          </div>
        )}
      </SettingsCard>

      {/* Google Tasks */}
      <SettingsCard title="Google Tasks" icon={<CheckIcon className="w-5 h-5" />}>
        <GoogleTasksSection accentColor="var(--dynamic-accent-start)" />
      </SettingsCard>

      {/* Webhooks */}
      <SettingsCard title="Webhooks" icon={<LinkIcon className="w-5 h-5" />}>
        <WebhooksSection accentColor="var(--dynamic-accent-start)" />
      </SettingsCard>

      <SettingsInfoBanner variant="tip">
        סנכרון ענן מאפשר לך לגשת לנתונים שלך מכל מכשיר. מומלץ לגבות באופן קבוע.
      </SettingsInfoBanner>
    </SettingsSection>
  );
};

export default IntegrationsSection;