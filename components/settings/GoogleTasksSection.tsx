/**
 * Google Tasks Settings Section
 * Settings UI component for configuring Google Tasks synchronization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircleIcon,
    RefreshIcon,
    WarningIcon,
    ExternalLinkIcon,
} from '../icons';
import * as googleTasksService from '../../services/googleTasksService';

interface GoogleTasksSectionProps {
    accentColor: string;
}

const GoogleTasksSection: React.FC<GoogleTasksSectionProps> = ({ accentColor }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [taskLists, setTaskLists] = useState<googleTasksService.GoogleTaskList[]>([]);
    const [selectedListId, setSelectedListId] = useState<string>('');
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<string | undefined>();
    const [isSyncing, setIsSyncing] = useState(false);

    const loadStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const status = await googleTasksService.getSyncStatus();
            setIsConnected(status.connected);
            setTaskLists(status.taskLists);
            setLastSyncError(status.lastSyncError);

            // Load saved preferences
            const savedListId = localStorage.getItem('spark_google_tasks_list_id');
            const savedSyncEnabled = localStorage.getItem('spark_google_tasks_sync_enabled');
            if (savedListId) setSelectedListId(savedListId);
            if (savedSyncEnabled) setSyncEnabled(savedSyncEnabled === 'true');
        } catch (error) {
            console.error('Failed to load Google Tasks status:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const handleListChange = (listId: string) => {
        setSelectedListId(listId);
        localStorage.setItem('spark_google_tasks_list_id', listId);
    };

    const handleSyncToggle = () => {
        const newValue = !syncEnabled;
        setSyncEnabled(newValue);
        localStorage.setItem('spark_google_tasks_sync_enabled', String(newValue));
    };

    const handleManualSync = async () => {
        if (!selectedListId || isSyncing) return;

        setIsSyncing(true);
        try {
            await googleTasksService.listTasks(selectedListId, { showCompleted: true });
            // Sync successful, fetched ${tasks.length} tasks
            setLastSyncError(undefined);
        } catch (error) {
            setLastSyncError(error instanceof Error ? error.message : 'Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 text-center text-muted">
                <RefreshIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>טוען מצב סנכרון...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}
                    >
                        {isConnected ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        ) : (
                            <WarningIcon className="w-5 h-5 text-red-400" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-[var(--text-primary)]">
                            {isConnected ? 'מחובר ל-Google Tasks' : 'לא מחובר'}
                        </p>
                        <p className="text-sm text-muted">
                            {isConnected
                                ? `${taskLists.length} רשימות זמינות`
                                : 'התחבר לחשבון Google כדי לסנכרן משימות'
                            }
                        </p>
                    </div>
                </div>

                {!isConnected && (
                    <button
                        onClick={() => window.location.href = '/settings?connect=google'}
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ background: accentColor, color: '#fff' }}
                    >
                        התחבר
                    </button>
                )}
            </div>

            {isConnected && (
                <>
                    {/* Select Task List */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-[var(--text-primary)]">
                            בחר רשימה לסנכרון
                        </label>
                        <select
                            value={selectedListId}
                            onChange={(e) => handleListChange(e.target.value)}
                            className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                        >
                            <option value="">בחר רשימה...</option>
                            {taskLists.map(list => (
                                <option key={list.id} value={list.id}>
                                    {list.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Auto Sync Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                        <div>
                            <p className="font-medium text-[var(--text-primary)]">סנכרון אוטומטי</p>
                            <p className="text-sm text-muted">סנכרן משימות אוטומטית ברקע</p>
                        </div>
                        <button
                            onClick={handleSyncToggle}
                            className={`relative w-12 h-6 rounded-full transition-colors ${syncEnabled ? '' : 'bg-[var(--bg-secondary)]'
                                }`}
                            style={syncEnabled ? { background: accentColor } : {}}
                        >
                            <span
                                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${syncEnabled ? 'translate-x-6' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Manual Sync Button */}
                    <button
                        onClick={handleManualSync}
                        disabled={!selectedListId || isSyncing}
                        className="w-full p-4 rounded-xl border border-[var(--border-primary)] flex items-center justify-center gap-2 hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'מסנכרן...' : 'סנכרן עכשיו'}</span>
                    </button>

                    {/* Error Display */}
                    {lastSyncError && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <p className="font-medium">שגיאת סנכרון:</p>
                            <p>{lastSyncError}</p>
                        </div>
                    )}

                    {/* Help Link */}
                    <a
                        href="https://support.google.com/tasks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted hover:text-[var(--text-primary)] transition-colors"
                    >
                        <ExternalLinkIcon className="w-4 h-4" />
                        <span>עזרה עם Google Tasks</span>
                    </a>
                </>
            )}
        </div>
    );
};

export default GoogleTasksSection;


