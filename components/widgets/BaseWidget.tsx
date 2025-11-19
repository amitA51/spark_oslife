import React, { ReactNode } from 'react';
import { WidgetSize } from '../../types';
import { SettingsIcon, RefreshIcon } from '../icons';

interface BaseWidgetProps {
    title: string;
    icon?: ReactNode;
    size?: WidgetSize;
    children: ReactNode;
    onRefresh?: () => void;
    onSettings?: () => void;
    onClick?: () => void;
    isLoading?: boolean;
    className?: string;
    actions?: ReactNode; // Custom action buttons
}

const BaseWidget: React.FC<BaseWidgetProps> = ({
    title,
    icon,
    size = 'medium',
    children,
    onRefresh,
    onSettings,
    onClick,
    isLoading = false,
    className = '',
    actions,
}) => {
    const sizeClasses = {
        small: 'min-h-[200px]',
        medium: 'min-h-[300px]',
        large: 'min-h-[400px]',
    };

    return (
        <div
            className={`
                bg-[var(--bg-card)] 
                border border-[var(--border-primary)] 
                rounded-2xl 
                overflow-hidden 
                flex flex-col
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] ${onClick ? 'cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors' : ''}`}
                onClick={onClick}
            >
                <div className="flex items-center gap-2">
                    {icon && <div className="text-[var(--dynamic-accent-start)]">{icon}</div>}
                    <h3 className="font-bold text-[var(--text-primary)]">{title}</h3>
                </div>
                <div className="flex items-center gap-1">
                    {actions}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                            title="רענן"
                        >
                            <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                    {onSettings && (
                        <button
                            onClick={onSettings}
                            className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                            title="הגדרות"
                        >
                            <SettingsIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-4 border-[var(--dynamic-accent-start)] border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default BaseWidget;
