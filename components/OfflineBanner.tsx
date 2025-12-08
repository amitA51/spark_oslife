import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineBannerProps {
  className?: string;
  position?: 'top' | 'bottom';
  showReconnectedMessage?: boolean;
  reconnectedDuration?: number;
}

/**
 * A banner component that displays when the user loses internet connectivity.
 * Shows a "back online" message when connection is restored.
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  className = '',
  position = 'top',
  showReconnectedMessage = true,
  reconnectedDuration = 3000,
}) => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  // Handle reconnection message
  useEffect(() => {
    if (isOnline && wasOffline && showReconnectedMessage) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, reconnectedDuration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, wasOffline, showReconnectedMessage, reconnectedDuration]);

  const positionClasses = position === 'top'
    ? 'top-0 left-0 right-0'
    : 'bottom-0 left-0 right-0';

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed ${positionClasses} z-[100] ${className}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-500/95 backdrop-blur-sm border-b border-red-400/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-3">
                {/* Offline Icon */}
                <svg
                  className="w-5 h-5 text-white animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                  />
                </svg>

                <div className="text-white text-sm font-medium">
                  <span className="font-bold">אין חיבור לאינטרנט</span>
                  <span className="text-white/80 mr-2">
                    — שינויים יישמרו מקומית ויסונכרנו כשהחיבור יחזור
                  </span>
                </div>

                {/* Retry button */}
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  נסה שוב
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showReconnected && isOnline && (
        <motion.div
          key="reconnected-banner"
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed ${positionClasses} z-[100] ${className}`}
          role="status"
          aria-live="polite"
        >
          <div className="bg-green-500/95 backdrop-blur-sm border-b border-green-400/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-3">
                {/* Online Icon */}
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>

                <span className="text-white text-sm font-medium">
                  החיבור חזר! מסנכרן נתונים...
                </span>

                {/* Checkmark animation */}
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Smaller, more subtle offline indicator for embedding in headers/navbars.
 */
export const OfflineIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full ${className}`}
    >
      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <span className="text-xs text-red-400 font-medium">אופליין</span>
    </motion.div>
  );
};

export default OfflineBanner;