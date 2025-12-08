import React from 'react';
import PasswordManager from '../components/password/PasswordManager';
import { Screen } from '../types';
import { ChevronRightIcon, KeyIcon } from '../components/icons';

interface PasswordManagerScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const PasswordManagerScreen: React.FC<PasswordManagerScreenProps> = ({ setActiveScreen }) => {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('settings')}
            className="p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors"
          >
            <ChevronRightIcon className="w-6 h-6 text-[var(--text-secondary)]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <KeyIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">מנהל סיסמאות</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto">
        <PasswordManager />
      </div>
    </div>
  );
};

export default PasswordManagerScreen;
