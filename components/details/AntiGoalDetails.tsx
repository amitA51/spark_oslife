import React, { useState } from 'react';
import { ViewProps, EditProps, inputStyles } from './common';
import MarkdownRenderer from '../MarkdownRenderer';
import ToggleSwitch from '../ToggleSwitch';
import { BanIcon, SparklesIcon, AlertTriangleIcon, CheckCircleIcon, TrashIcon, PlusIcon } from '../icons';

// Trigger category labels
const TRIGGER_CATEGORIES: Record<string, string> = {
    emotional: '🧠 רגשי',
    situational: '📍 מצבי',
    social: '👥 חברתי',
    physical: '💪 פיזי',
    other: '📝 אחר',
};

export const AntiGoalView: React.FC<ViewProps> = ({ item }) => {
    const data = item.antiGoalData;

    // Calculate avoidance days
    const lastSlipDate = data?.slipHistory?.length
        ? new Date(data.slipHistory[data.slipHistory.length - 1]?.date ?? item.createdAt)
        : new Date(item.createdAt);
    const avoidanceDays = Math.floor(
        (new Date().getTime() - lastSlipDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <BanIcon className="w-8 h-8 text-red-400" />
                        </div>
                        <span
                            className="absolute -bottom-1 -right-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-2 py-0.5 shadow-lg"
                        >
                            {avoidanceDays}d
                        </span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-white text-lg">מצב הימנעות</h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {avoidanceDays > 0
                                ? `🛡️ נמנע בהצלחה כבר ${avoidanceDays} ימים!`
                                : '💪 בוא נתחיל את המסע!'}
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-black/20 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-amber-400">{data?.longestStreak || 0}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">שיא רצף</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-cyan-400">{data?.totalAvoidedDays || 0}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">סה"כ ימים</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-red-400">{data?.slipHistory?.length || 0}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">מעידות</div>
                    </div>
                </div>
            </div>

            {/* Motivation */}
            {data?.motivation && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" />
                        למה זה חשוב לי
                    </h4>
                    <p className="text-white/90">{data.motivation}</p>
                </div>
            )}

            {/* Reward */}
            {data?.reward && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">🎁 הפרס שלי</h4>
                    <p className="text-white/90">{data.reward}</p>
                </div>
            )}

            {/* Triggers */}
            {data?.triggers && data.triggers.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-[var(--accent-highlight)] mb-3 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangleIcon className="w-4 h-4" />
                        טריגרים ({data.triggers.length})
                    </h4>
                    <div className="space-y-2">
                        {data.triggers.map((trigger) => (
                            <div
                                key={trigger.id}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
                            >
                                <span className="text-lg">{TRIGGER_CATEGORIES[trigger.category]?.split(' ')[0]}</span>
                                <div className="flex-1">
                                    <p className="text-sm text-white">{trigger.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-[var(--text-secondary)]">
                                            עוצמה: {'⚡'.repeat(trigger.intensity)}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">
                                            • הופיע {trigger.count}x
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Alternative Actions */}
            {data?.alternativeActions && data.alternativeActions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-[var(--accent-highlight)] mb-3 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4" />
                        פעולות חלופיות ({data.alternativeActions.length})
                    </h4>
                    <div className="space-y-2">
                        {data.alternativeActions.map((action) => (
                            <div
                                key={action.id}
                                className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"
                            >
                                <div className="flex-1">
                                    <p className="text-sm text-white">{action.action}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {action.duration && (
                                            <span className="text-[10px] text-[var(--text-secondary)]">
                                                ⏱️ {action.duration} דקות
                                            </span>
                                        )}
                                        <span className="text-[10px] text-[var(--text-secondary)]">
                                            • השתמשת {action.usageCount}x
                                        </span>
                                        <span className="text-[10px] text-green-400">
                                            • יעילות {action.effectiveness}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slip History */}
            {data?.slipHistory && data.slipHistory.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider">
                        היסטוריית מעידות
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {data.slipHistory.slice().reverse().slice(0, 5).map((slip) => (
                            <div
                                key={slip.id}
                                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                            >
                                <span className={`text-lg ${slip.severity === 'major' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {slip.severity === 'major' ? '🔴' : '🟡'}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm text-white/80">
                                        {new Date(slip.date).toLocaleDateString('he-IL', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    {slip.notes && (
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">{slip.notes}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes */}
            {item.content && (
                <div>
                    <h4 className="text-sm font-semibold text-[var(--accent-highlight)] mb-2 uppercase tracking-wider">
                        הערות
                    </h4>
                    <MarkdownRenderer content={item.content} />
                </div>
            )}
        </div>
    );
};

export const AntiGoalEdit: React.FC<EditProps> = ({ editState, dispatch }) => {
    const [newTrigger, setNewTrigger] = useState({ description: '', category: 'other' as const, intensity: 3 as const });
    const [newAction, setNewAction] = useState({ action: '', duration: 5 });

    const antiGoalData = editState.antiGoalData || {
        triggers: [],
        alternativeActions: [],
        slipHistory: [],
        longestStreak: 0,
        totalAvoidedDays: 0,
        dailyCheckIn: true,
    };

    const updateAntiGoalData = (updates: Partial<typeof antiGoalData>) => {
        dispatch({
            type: 'SET_FIELD',
            payload: {
                field: 'antiGoalData',
                value: { ...antiGoalData, ...updates },
            },
        });
    };

    const addTrigger = () => {
        if (!newTrigger.description.trim()) return;

        updateAntiGoalData({
            triggers: [
                ...antiGoalData.triggers,
                {
                    id: `trigger-${Date.now()}`,
                    description: newTrigger.description,
                    category: newTrigger.category,
                    intensity: newTrigger.intensity as 1 | 2 | 3 | 4 | 5,
                    count: 0,
                },
            ],
        });
        setNewTrigger({ description: '', category: 'other', intensity: 3 });
    };

    const removeTrigger = (id: string) => {
        updateAntiGoalData({
            triggers: antiGoalData.triggers.filter((t: { id: string }) => t.id !== id),
        });
    };

    const addAction = () => {
        if (!newAction.action.trim()) return;

        updateAntiGoalData({
            alternativeActions: [
                ...antiGoalData.alternativeActions,
                {
                    id: `action-${Date.now()}`,
                    action: newAction.action,
                    duration: newAction.duration,
                    effectiveness: 50,
                    usageCount: 0,
                },
            ],
        });
        setNewAction({ action: '', duration: 5 });
    };

    const removeAction = (id: string) => {
        updateAntiGoalData({
            alternativeActions: antiGoalData.alternativeActions.filter((a: { id: string }) => a.id !== id),
        });
    };

    return (
        <div className="space-y-6">
            {/* Daily Check-in Toggle */}
            <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <label htmlFor="dailyCheckIn" className="font-medium text-white">
                            צ'ק-אין יומי
                        </label>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            קבל תזכורת יומית לאשר שעמדת ביעד
                        </p>
                    </div>
                    <ToggleSwitch
                        id="dailyCheckIn"
                        checked={antiGoalData.dailyCheckIn}
                        onChange={(val) => updateAntiGoalData({ dailyCheckIn: val })}
                    />
                </div>
            </div>

            {/* Motivation */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    💡 למה זה חשוב לי?
                </label>
                <textarea
                    dir="auto"
                    value={antiGoalData.motivation || ''}
                    onChange={(e) => updateAntiGoalData({ motivation: e.target.value })}
                    rows={2}
                    placeholder="למשל: כי אני רוצה להיות בריא יותר..."
                    className={inputStyles}
                />
            </div>

            {/* Reward */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    🎁 הפרס שלי (אחרי הצלחה)
                </label>
                <input
                    type="text"
                    dir="auto"
                    value={antiGoalData.reward || ''}
                    onChange={(e) => updateAntiGoalData({ reward: e.target.value })}
                    placeholder="למשל: סופ״ש במלון..."
                    className={inputStyles}
                />
            </div>

            {/* Triggers Section */}
            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangleIcon className="w-4 h-4" />
                    טריגרים - מה גורם לך ליפול?
                </h4>

                {/* Existing triggers */}
                {antiGoalData.triggers.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {antiGoalData.triggers.map((trigger: { id: string; description: string; category: string; intensity: number }) => (
                            <div key={trigger.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                <span>{TRIGGER_CATEGORIES[trigger.category]?.split(' ')[0]}</span>
                                <span className="flex-1 text-sm text-white truncate">{trigger.description}</span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {'⚡'.repeat(trigger.intensity)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeTrigger(trigger.id)}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add trigger form */}
                <div className="space-y-2">
                    <input
                        type="text"
                        value={newTrigger.description}
                        onChange={(e) => setNewTrigger({ ...newTrigger, description: e.target.value })}
                        placeholder="תאר את הטריגר..."
                        className={inputStyles + ' text-sm'}
                    />
                    <div className="flex gap-2">
                        <select
                            value={newTrigger.category}
                            onChange={(e) => setNewTrigger({ ...newTrigger, category: e.target.value as any })}
                            className={inputStyles + ' flex-1 text-sm'}
                        >
                            {Object.entries(TRIGGER_CATEGORIES).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <select
                            value={newTrigger.intensity}
                            onChange={(e) => setNewTrigger({ ...newTrigger, intensity: Number(e.target.value) as any })}
                            className={inputStyles + ' w-24 text-sm'}
                        >
                            {[1, 2, 3, 4, 5].map(n => (
                                <option key={n} value={n}>{'⚡'.repeat(n)}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={addTrigger}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        >
                            <PlusIcon className="w-5 h-5 text-red-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Alternative Actions Section */}
            <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    פעולות חלופיות - מה לעשות במקום?
                </h4>

                {/* Existing actions */}
                {antiGoalData.alternativeActions.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {antiGoalData.alternativeActions.map((action: { id: string; action: string; duration?: number }) => (
                            <div key={action.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                <span className="flex-1 text-sm text-white truncate">{action.action}</span>
                                {action.duration && (
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        ⏱️ {action.duration}m
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeAction(action.id)}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add action form */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newAction.action}
                        onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                        placeholder="מה לעשות במקום..."
                        className={inputStyles + ' flex-1 text-sm'}
                    />
                    <input
                        type="number"
                        value={newAction.duration}
                        onChange={(e) => setNewAction({ ...newAction, duration: Number(e.target.value) })}
                        placeholder="דקות"
                        min={1}
                        max={120}
                        className={inputStyles + ' w-20 text-sm text-center'}
                    />
                    <button
                        type="button"
                        onClick={addAction}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 text-green-400" />
                    </button>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">הערות</label>
                <textarea
                    dir="auto"
                    value={editState.content}
                    onChange={(e) =>
                        dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: e.target.value } })
                    }
                    rows={3}
                    className={inputStyles}
                />
            </div>
        </div>
    );
};
