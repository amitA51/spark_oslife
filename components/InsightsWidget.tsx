import React, { useMemo } from 'react';
import { getInsightsSummary } from '../services/correlationsService';
import type { PersonalItem } from '../types';
import { BORDER_RADIUS } from '../constants/designTokens';
import { SparklesIcon, TrendingUpIcon, CalendarIcon } from './icons';

interface InsightsWidgetProps {
    personalItems: PersonalItem[];
}

const InsightsWidget: React.FC<InsightsWidgetProps> = ({ personalItems }) => {
    const insights = useMemo(() => getInsightsSummary(personalItems), [personalItems]);

    if (insights.totalEvents < 10) {
        return (
            <div
                className="themed-card p-6 border border-[var(--border-primary)]"
                style={{ borderRadius: BORDER_RADIUS.xl }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--dynamic-accent-start)]/20 flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">תובנות על החיים שלך</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    המשך לעבוד עם Spark כדי לגלות דפוסים והקשרים מעניינים בחייך.
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)]"
                            style={{ width: `${(insights.totalEvents / 10) * 100}%` }}
                        />
                    </div>
                    <span className="shrink-0">{insights.totalEvents}/10</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="themed-card p-6 border border-[var(--border-primary)]"
            style={{ borderRadius: BORDER_RADIUS.xl }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--dynamic-accent-start)]/20 flex items-center justify-center animate-pulse">
                        <SparklesIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">תובנות</h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                            מבוסס על {insights.totalEvents} אירועים
                        </p>
                    </div>
                </div>
            </div>

            {/* Correlations */}
            {insights.correlations.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[var(--dynamic-accent-highlight)] mb-3 flex items-center gap-2">
                        <TrendingUpIcon className="w-4 h-4" />
                        קשרים שמצאנו
                    </h4>
                    <div className="space-y-3">
                        {insights.correlations.map(corr => (
                            <div
                                key={corr.id}
                                className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${corr.strength === 'strong' ? 'bg-green-500/20 text-green-400' :
                                                    corr.strength === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {corr.strength === 'strong' ? 'חזק' : corr.strength === 'moderate' ? 'בינוני' : 'חלש'}
                                            </span>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {corr.confidenceLevel.toFixed(0)}% ביטחון
                                            </span>
                                        </div>
                                        <p className="text-sm text-white leading-relaxed">
                                            {corr.insight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Patterns */}
            {insights.patterns.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-[var(--dynamic-accent-highlight)] mb-3 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        דפוסים שזיהינו
                    </h4>
                    <div className="space-y-2">
                        {insights.patterns.map(pattern => (
                            <div
                                key={pattern.id}
                                className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-primary)]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pattern.type === 'streak' ? 'bg-orange-500/20 text-orange-400' :
                                            pattern.type === 'time_of_day' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-cyan-500/20 text-cyan-400'
                                        }`}>
                                        {pattern.type === 'streak' ? '🔥' : pattern.type === 'time_of_day' ? '⏰' : '📅'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white mb-0.5">
                                            {pattern.title}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {pattern.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {insights.correlations.length === 0 && insights.patterns.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-sm text-[var(--text-secondary)]">
                        המשך לעבוד עם Spark כדי לגלות תובנות מעניינות
                    </p>
                </div>
            )}
        </div>
    );
};

export default InsightsWidget;
