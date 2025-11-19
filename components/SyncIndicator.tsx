import React, { useState, useEffect } from 'react';
import { syncService, type SyncState } from '../services/syncService';

const SyncIndicator: React.FC = () => {
    const [syncState, setSyncState] = useState<SyncState>(syncService.getState());
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Subscribe to sync state changes
        const unsubscribe = syncService.subscribe(setSyncState);
        return unsubscribe;
    }, []);

    const getStatusIcon = () => {
        switch (syncState.status) {
            case 'idle':
                return (
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'syncing':
                return (
                    <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                );
            case 'conflict':
                return (
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const getStatusText = () => {
        switch (syncState.status) {
            case 'idle':
                return 'מסונכרן';
            case 'syncing':
                return 'מסנכרן...';
            case 'conflict':
                return `${syncState.conflictCount} קונפליקטים`;
            case 'error':
                return 'שגיאה';
        }
    };

    const handleSync = async () => {
        await syncService.syncNow();
    };

    return (
        <div className="relative">
            {/* Indicator Button */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                title="מצב סנכרון"
            >
                {getStatusIcon()}
                <span className="text-xs text-[var(--text-secondary)]">
                    {getStatusText()}
                </span>
            </button>

            {/* Details Dropdown */}
            {showDetails && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDetails(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 overflow-hidden animate-screen-enter">
                        <div className="p-4 border-b border-[var(--border-color)]">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                                סטטוס סנכרון
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                                {getStatusIcon()}
                                <span className="text-[var(--text-secondary)]">
                                    {getStatusText()}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {/* Last Sync Time */}
                            {syncState.lastSyncTime && (
                                <div>
                                    <div className="text-xs text-[var(--text-tertiary)] mb-1">
                                        סנכרון אחרון
                                    </div>
                                    <div className="text-sm text-[var(--text-primary)]">
                                        {new Date(syncState.lastSyncTime).toLocaleString('he-IL')}
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {syncState.status === 'error' && syncState.lastError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div className="text-xs text-red-500 font-medium mb-1">
                                        שגיאה
                                    </div>
                                    <div className="text-xs text-red-500/80">
                                        {syncState.lastError}
                                    </div>
                                </div>
                            )}

                            {/* Conflict Warning */}
                            {syncState.status === 'conflict' && (
                                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                    <div className="text-xs text-orange-500 font-medium mb-1">
                                        קונפליקטים זוהו
                                    </div>
                                    <div className="text-xs text-orange-500/80">
                                        {syncState.conflictCount} פריטים דורשים פתרון
                                    </div>
                                </div>
                            )}

                            {/* Sync Now Button */}
                            <button
                                onClick={handleSync}
                                disabled={syncState.status === 'syncing'}
                                className="w-full px-4 py-2 bg-[var(--accent-gradient)] text-black rounded-lg hover:brightness-110 transition-all font-medium text-sm shadow-[0_2px_10px_var(--dynamic-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {syncState.status === 'syncing' ? 'מסנכרן...' : 'סנכרן עכשיו'}
                            </button>

                            {/* Settings Link */}
                            <button
                                onClick={() => {
                                    setShowDetails(false);
                                    // Navigate to settings - you'll need to implement this
                                }}
                                className="w-full px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm"
                            >
                                הגדרות סנכרון
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SyncIndicator;
