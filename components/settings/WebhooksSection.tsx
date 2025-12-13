/**
 * Webhooks Settings Section
 * Settings UI component for managing webhook configurations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusIcon,
    TrashIcon,
    RefreshIcon,
    CheckCircleIcon,
    WarningIcon,
    LinkIcon,
    ChevronDownIcon,
} from '../icons';
import * as webhookService from '../../services/webhookService';
import type { Webhook, WebhookEvent, WebhookLog } from '../../services/webhookService';

interface WebhooksSectionProps {
    accentColor: string;
}

const EVENT_LABELS: Record<WebhookEvent, string> = {
    'task.completed': '✅ משימה הושלמה',
    'task.created': '📝 משימה נוצרה',
    'habit.completed': '🔁 הרגל הושלם',
    'item.created': '➕ פריט נוצר',
    'item.deleted': '🗑️ פריט נמחק',
    'workout.completed': '💪 אימון הסתיים',
};

const WebhooksSection: React.FC<WebhooksSectionProps> = ({ accentColor }) => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newWebhook, setNewWebhook] = useState({
        name: '',
        url: '',
        events: [] as WebhookEvent[],
        secret: '',
    });
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [logs, setLogs] = useState<WebhookLog[]>([]);

    const loadWebhooks = useCallback(() => {
        setWebhooks(webhookService.getWebhooks());
    }, []);

    useEffect(() => {
        loadWebhooks();
    }, [loadWebhooks]);

    const handleAddWebhook = () => {
        if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
            alert('נא למלא שם, URL ולבחור לפחות אירוע אחד');
            return;
        }

        webhookService.addWebhook({
            name: newWebhook.name,
            url: newWebhook.url,
            events: newWebhook.events,
            secret: newWebhook.secret || undefined,
            isActive: true,
        });

        setNewWebhook({ name: '', url: '', events: [], secret: '' });
        setIsAddingNew(false);
        loadWebhooks();
    };

    const handleDeleteWebhook = (id: string) => {
        if (window.confirm('האם למחוק את ה-Webhook?')) {
            webhookService.removeWebhook(id);
            loadWebhooks();
        }
    };

    const handleToggleWebhook = (id: string) => {
        webhookService.toggleWebhook(id);
        loadWebhooks();
    };

    const handleTestWebhook = async (id: string) => {
        setTestingId(id);
        setTestResult(null);

        try {
            const result = await webhookService.testWebhook(id);
            setTestResult({
                success: result.success,
                message: result.success
                    ? `הצלחה! (${result.responseTime}ms)`
                    : `שגיאה: ${result.error}`,
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'שגיאה לא ידועה',
            });
        } finally {
            setTestingId(null);
        }
    };

    const handleToggleEvent = (event: WebhookEvent) => {
        setNewWebhook(prev => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter(e => e !== event)
                : [...prev.events, event],
        }));
    };

    const handleExpandWebhook = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setLogs([]);
        } else {
            setExpandedId(id);
            setLogs(webhookService.getWebhookLogs(id, 10));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Webhooks</h3>
                    <p className="text-sm text-muted">שלח התראות לשירותים חיצוניים</p>
                </div>
                <button
                    onClick={() => setIsAddingNew(true)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: accentColor }}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Add New Webhook Form */}
            {isAddingNew && (
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-4">
                    <input
                        type="text"
                        placeholder="שם ה-Webhook"
                        value={newWebhook.name}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
                    />

                    <input
                        type="url"
                        placeholder="https://example.com/webhook"
                        value={newWebhook.url}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
                    />

                    <input
                        type="text"
                        placeholder="מפתח סודי (אופציונלי)"
                        value={newWebhook.secret}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
                    />

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">אירועים:</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(EVENT_LABELS).map(([event, label]) => (
                                <button
                                    key={event}
                                    onClick={() => handleToggleEvent(event as WebhookEvent)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${newWebhook.events.includes(event as WebhookEvent)
                                            ? 'text-white'
                                            : 'bg-[var(--bg-secondary)] text-muted'
                                        }`}
                                    style={newWebhook.events.includes(event as WebhookEvent)
                                        ? { background: accentColor }
                                        : {}
                                    }
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAddWebhook}
                            className="flex-1 p-3 rounded-lg text-white font-medium"
                            style={{ background: accentColor }}
                        >
                            הוסף Webhook
                        </button>
                        <button
                            onClick={() => setIsAddingNew(false)}
                            className="px-4 py-3 rounded-lg bg-[var(--bg-secondary)] text-muted"
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            )}

            {/* Webhooks List */}
            {webhooks.length === 0 ? (
                <div className="p-8 text-center text-muted">
                    <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>אין Webhooks מוגדרים</p>
                    <p className="text-sm">לחץ על + להוספת Webhook חדש</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {webhooks.map(webhook => (
                        <div
                            key={webhook.id}
                            className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] overflow-hidden"
                        >
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full ${webhook.isActive ? 'bg-green-400' : 'bg-gray-400'
                                            }`}
                                    />
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">{webhook.name}</p>
                                        <p className="text-xs text-muted truncate max-w-[200px]">{webhook.url}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleTestWebhook(webhook.id)}
                                        disabled={testingId === webhook.id}
                                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                                        title="בדוק חיבור"
                                    >
                                        <RefreshIcon className={`w-4 h-4 text-muted ${testingId === webhook.id ? 'animate-spin' : ''}`} />
                                    </button>

                                    <button
                                        onClick={() => handleToggleWebhook(webhook.id)}
                                        className={`p-2 rounded-lg transition-colors ${webhook.isActive ? 'text-green-400' : 'text-muted'
                                            }`}
                                        title={webhook.isActive ? 'כבה' : 'הפעל'}
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handleExpandWebhook(webhook.id)}
                                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                        <ChevronDownIcon
                                            className={`w-4 h-4 text-muted transition-transform ${expandedId === webhook.id ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded View */}
                            {expandedId === webhook.id && (
                                <div className="border-t border-[var(--border-primary)] p-4 space-y-3">
                                    <div className="flex flex-wrap gap-1">
                                        {webhook.events.map(event => (
                                            <span
                                                key={event}
                                                className="px-2 py-0.5 text-xs rounded bg-[var(--bg-secondary)] text-muted"
                                            >
                                                {EVENT_LABELS[event]}
                                            </span>
                                        ))}
                                    </div>

                                    {webhook.failureCount > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-orange-400">
                                            <WarningIcon className="w-4 h-4" />
                                            <span>{webhook.failureCount} כשלונות רצופים</span>
                                        </div>
                                    )}

                                    {logs.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted">הפעלות אחרונות:</p>
                                            {logs.map(log => (
                                                <div
                                                    key={log.id}
                                                    className="flex items-center justify-between text-xs py-1"
                                                >
                                                    <span className={log.success ? 'text-green-400' : 'text-red-400'}>
                                                        {log.success ? '✓' : '✗'} {log.event}
                                                    </span>
                                                    <span className="text-muted">
                                                        {new Date(log.timestamp).toLocaleTimeString('he-IL')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Test Result Toast */}
            {testResult && (
                <div
                    className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm ${testResult.success ? 'bg-green-500' : 'bg-red-500'
                        } text-white shadow-lg`}
                >
                    {testResult.message}
                </div>
            )}
        </div>
    );
};

export default WebhooksSection;


