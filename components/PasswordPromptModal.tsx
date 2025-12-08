import React, { useState } from 'react';
import { LockIcon, CloseIcon } from './icons';

interface PasswordPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  title?: string;
  description?: string;
  isConfirm?: boolean; // If true, ask for password twice (for setting new password)
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Enter Password',
  description,
  isConfirm = false,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirm && password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    if (!password) {
      setError('הסיסמה לא יכולה להיות ריקה');
      return;
    }
    onSubmit(password);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/10">
                <LockIcon className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
                {description && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)] outline-none transition-all"
                autoFocus
              />
            </div>
            {isConfirm && (
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="אמת סיסמה"
                  className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--dynamic-accent-start)] outline-none transition-all"
                />
              </div>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--accent-gradient)] text-white font-bold shadow-lg hover:brightness-110 transition-all"
              >
                אישור
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordPromptModal;
