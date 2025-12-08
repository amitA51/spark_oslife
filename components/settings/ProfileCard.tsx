import React from 'react';
import { LogoutIcon, EditIcon, CrownIcon, CalendarIcon } from '../../components/icons';
import { useSettings } from '../../src/contexts/SettingsContext';
import { useUser } from '../../src/contexts/UserContext';
import * as authService from '../../services/authService';
import { StatusMessageType } from '../../components/StatusMessage';

const ProfileCard: React.FC<{ setStatusMessage: (msg: { type: StatusMessageType; text: string; id: number } | null) => void }> = ({ setStatusMessage }) => {
  const { settings, updateSettings } = useSettings();
  const { user } = useUser();

  // Calculate days using app (mock for now)
  const daysUsingApp = 42;

  const handleLogout = async () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      try {
        await authService.logout();
        window.location.reload();
      } catch (error) {
        console.error('Logout Error:', error);
        setStatusMessage({ type: 'error', text: 'שגיאה בהתנתקות.', id: Date.now() });
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-white/[0.08] mb-6">
      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--dynamic-accent-start)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--dynamic-accent-end)]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="relative z-10 p-6">
        <div className="flex items-start gap-5">
          {/* Avatar with animated ring */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity animate-pulse-slow" />
            <div className="relative w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center text-4xl border-2 border-[var(--dynamic-accent-start)]/50 shadow-xl overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <input
                  type="text"
                  value={settings.userEmoji || '👋'}
                  onChange={e => updateSettings({ userEmoji: e.target.value })}
                  className="bg-transparent w-full text-center focus:outline-none cursor-pointer"
                  maxLength={2}
                />
              )}
            </div>
            {/* Edit overlay */}
            <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <EditIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {user ? (
                <span className="text-xl font-bold text-white truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              ) : (
                <input
                  type="text"
                  value={settings.userName || ''}
                  onChange={e => updateSettings({ userName: e.target.value })}
                  placeholder="השם שלך"
                  className="bg-transparent text-xl font-bold text-white placeholder-[var(--text-secondary)] focus:outline-none w-full"
                />
              )}
              {/* Pro Badge */}
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/30">
                <CrownIcon className="w-3 h-3" />
                Pro
              </span>
            </div>

            {user && (
              <p className="text-sm text-[var(--text-secondary)] truncate mb-3">
                {user.email}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-[var(--dynamic-accent-start)]" />
                <span className="text-[var(--text-secondary)]">
                  <span className="text-white font-semibold">{daysUsingApp}</span> ימים באפליקציה
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all group"
              title="התנתק"
            >
              <LogoutIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Quick Actions */}
        {!user && (
          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              התחבר כדי לסנכרן את הנתונים שלך בין מכשירים
            </p>
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white font-semibold hover:brightness-110 transition-all shadow-lg shadow-[var(--dynamic-accent-glow)]/30">
              התחבר עכשיו
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;