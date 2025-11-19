import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget';
import { ChartBarIcon } from '../icons';
import { performanceService, type PerformanceReport } from '../../services/performanceService';

const PerformanceWidget: React.FC = () => {
    const [report, setReport] = useState<PerformanceReport | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Generate initial report
        updateReport();

        // Update report every 30 seconds
        const interval = setInterval(updateReport, 30000);
        return () => clearInterval(interval);
    }, []);

    const updateReport = () => {
        const newReport = performanceService.generateReport();
        setReport(newReport);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 70) return 'text-yellow-500';
        if (score >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'מצוין';
        if (score >= 70) return 'טוב';
        if (score >= 50) return 'בינוני';
        return 'דורש שיפור';
    };

    const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
        switch (severity) {
            case 'high': return 'text-red-500 bg-red-500/10';
            case 'medium': return 'text-orange-500 bg-orange-500/10';
            case 'low': return 'text-yellow-500 bg-yellow-500/10';
        }
    };

    const getSeverityLabel = (severity: 'low' | 'medium' | 'high') => {
        switch (severity) {
            case 'high': return 'גבוהה';
            case 'medium': return 'בינונית';
            case 'low': return 'נמוכה';
        }
    };

    const exportReport = () => {
        if (!report) return;
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance-report-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!report) {
        return (
            <BaseWidget
                title="ביצועים"
                icon={<ChartBarIcon className="w-5 h-5" />}
                size="small"
                isLoading={true}
            >
                <div />
            </BaseWidget>
        );
    }

    return (
        <BaseWidget
            title="ביצועים"
            icon={<ChartBarIcon className="w-5 h-5" />}
            size="small"
            onRefresh={updateReport}
        >
            <div className="space-y-4">
                {/* Performance Score */}
                <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(report.score)}`}>
                        {report.score}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">
                        {getScoreLabel(report.score)}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    {report.metrics.slice(0, 4).map((metric) => (
                        <div
                            key={metric.name}
                            className="bg-[var(--surface-secondary)] rounded-lg p-3 border border-[var(--border-color)]"
                        >
                            <div className="text-xs text-[var(--text-tertiary)] mb-1">
                                {metric.name}
                            </div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">
                                {metric.value.toFixed(0)}
                                <span className="text-xs text-[var(--text-secondary)] ml-1">
                                    {metric.unit}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Issues Summary */}
                {report.issues.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                                בעיות ({report.issues.length})
                            </h4>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-xs text-[var(--dynamic-accent-start)] hover:underline"
                            >
                                {isExpanded ? 'הסתר' : 'הצג הכל'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(isExpanded ? report.issues : report.issues.slice(0, 2)).map((issue, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{issue.message}</div>
                                            <div className="text-xs opacity-80 mt-1">
                                                {issue.metric}: {issue.value.toFixed(0)}{report.metrics.find(m => m.name === issue.metric)?.unit || 'ms'}
                                                {' '}(סף: {issue.threshold})
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-current/10">
                                            {getSeverityLabel(issue.severity)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Suggestion */}
                {report.suggestions.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-blue-500">
                                    {report.suggestions[0].title}
                                </div>
                                <div className="text-xs text-blue-500/80 mt-1">
                                    {report.suggestions[0].description}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={exportReport}
                        className="flex-1 px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm font-medium"
                    >
                        ייצא דוח
                    </button>
                    <button
                        onClick={() => performanceService.clearMetrics()}
                        className="px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm"
                        title="נקה מדדים"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-center text-[var(--text-tertiary)]">
                    עודכן: {new Date(report.timestamp).toLocaleTimeString('he-IL')}
                </div>
            </div>
        </BaseWidget>
    );
};

export default PerformanceWidget;
