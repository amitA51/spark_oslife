/**
 * Investment Screen Components
 * 
 * Extracted components from InvestmentsScreen.tsx for better maintainability
 * and potential reuse.
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import type { FinancialAsset } from '../../types';
import * as financialsService from '../../services/financialsService';
import {
    TrashIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    FlameIcon,
} from '../icons';
import { UltraCard } from '../ui/UltraCard';

// ============================================================================
// Animated Counter
// ============================================================================

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

/**
 * Animated counter that smoothly transitions between values.
 * Skips animation for micro-changes (<0.01% difference) for performance.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = memo(({
    value,
    prefix = '',
    suffix = '',
    decimals = 2
}) => {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValue = useRef(value);

    useEffect(() => {
        const start = prevValue.current;
        const end = value;

        // PERFORMANCE: Skip animation for micro-changes (<0.01% difference)
        const percentChange = Math.abs((end - start) / (start || 1));
        if (percentChange < 0.0001) {
            setDisplayValue(value);
            prevValue.current = value;
            return;
        }

        const duration = 600;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * ease;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                prevValue.current = value;
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <span>
            {prefix}
            {displayValue.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
            {suffix}
        </span>
    );
});

AnimatedCounter.displayName = 'AnimatedCounter';

// ============================================================================
// Ticker Tape
// ============================================================================

interface TickerTapeItemProps {
    symbol: string;
    price: number;
    change: number;
}

export const TickerTapeItem: React.FC<TickerTapeItemProps> = memo(({ symbol, price, change }) => (
    <div className="flex items-center gap-3 px-5 border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
        <span className="font-bold text-white/90 text-xs">{symbol}</span>
        <span className="font-mono text-white/60 text-xs">${price.toFixed(2)}</span>
        <span className={`text-[10px] font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
    </div>
));

TickerTapeItem.displayName = 'TickerTapeItem';

interface TickerTapeProps {
    items: financialsService.TopMover[];
}

export const TickerTape: React.FC<TickerTapeProps> = memo(({ items }) => {
    if (!items.length) return null;

    return (
        <div className="w-full bg-black/50 border-b border-white/5 backdrop-blur-md overflow-hidden flex h-9 items-center">
            <div className="animate-marquee flex items-center whitespace-nowrap">
                {items.map((item, i) => (
                    <TickerTapeItem key={`${item.ticker}-${i}`} symbol={item.ticker} price={item.price} change={item.changePercent} />
                ))}
                {items.map((item, i) => (
                    <TickerTapeItem key={`dup-${item.ticker}-${i}`} symbol={item.ticker} price={item.price} change={item.changePercent} />
                ))}
            </div>
            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
});

TickerTape.displayName = 'TickerTape';

// ============================================================================
// Mini Chart
// ============================================================================

interface MiniChartProps {
    data?: number[];
    isPositive: boolean;
    height?: number;
}

export const MiniChart: React.FC<MiniChartProps> = memo(({
    data,
    isPositive,
    height = 32
}) => {
    if (!data || data.length < 2) return <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse" />;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = (height - 2) - ((d - min) / range) * (height - 4);
        return `${x},${y}`;
    }).join(' ');

    const color = isPositive ? '#10B981' : '#EF4444';

    return (
        <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <defs>
                <linearGradient id={`cg-${isPositive ? 1 : 0}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon fill={`url(#cg-${isPositive ? 1 : 0})`} points={`0,${height} ${points} 100,${height}`} />
            <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
        </svg>
    );
});

MiniChart.displayName = 'MiniChart';

// ============================================================================
// Market Status Badge
// ============================================================================

interface MarketStatusBadgeProps {
    isOpen: boolean;
}

export const MarketStatusBadge: React.FC<MarketStatusBadgeProps> = ({ isOpen }) => (
    <div className={`
    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase
    ${isOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}
  `}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        {isOpen ? 'פתוח' : 'סגור'}
    </div>
);

// ============================================================================
// Asset Card
// ============================================================================

interface AssetCardProps {
    asset: FinancialAsset;
    onRemove: () => void;
    onClick: () => void;
    isCrypto: boolean;
}

export const AssetCard = memo(function AssetCard({
    asset,
    onRemove,
    onClick,
    isCrypto
}: AssetCardProps) {
    const isPositive = (asset.change24h || 0) >= 0;
    const changeAbs = Math.abs(asset.change24h || 0);
    const isHot = changeAbs > 5;

    return (
        <UltraCard
            onClick={onClick}
            variant="glass"
            glowColor={isPositive ? 'cyan' : 'magenta'}
            noPadding
            className="group relative cursor-pointer"
        >
            <div className="p-4">
                {/* Hot indicator */}
                {isHot && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[8px] font-bold z-20">
                        <FlameIcon className="w-2.5 h-2.5" />
                        חם!
                    </div>
                )}

                {/* Side indicator */}
                <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />

                {/* Type badge */}
                <div className="absolute top-2 right-2 opacity-40 text-[10px]">
                    {isCrypto ? '₿' : '📈'}
                </div>

                <div className="flex justify-between items-start mb-2 pl-3 pr-6">
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight font-mono">{asset.ticker}</h3>
                        <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{asset.name}</span>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-bold text-white font-mono">
                            <AnimatedCounter value={asset.price || 0} prefix="$" />
                        </div>
                        <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                            <span className="font-mono">{isPositive ? '+' : ''}{asset.change24h?.toFixed(2) || '0.00'}%</span>
                        </div>
                    </div>
                </div>

                <div className="h-8 mt-2 opacity-60 group-hover:opacity-100 transition-opacity pl-3">
                    <MiniChart data={asset.sparkline} isPositive={isPositive} height={32} />
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute bottom-2 right-2 p-2 rounded-full text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </UltraCard>
    );
});

// ============================================================================
// News Card
// ============================================================================

interface NewsCardProps {
    news: financialsService.NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = memo(({ news }) => (
    <UltraCard
        variant="glass"
        glowColor="violet"
        noPadding
        className="group"
    >
        <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3"
        >
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-white/40">
                        <span className="uppercase font-bold tracking-wider text-purple-400">{news.source}</span>
                        <span>•</span>
                        <span>{new Date(news.datetime * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white/90 leading-tight group-hover:text-purple-300 transition-colors line-clamp-2">
                        {news.headline}
                    </h4>
                </div>
            </div>
        </a>
    </UltraCard>
));

NewsCard.displayName = 'NewsCard';

// ============================================================================
// Macro Item
// ============================================================================

interface MacroItemProps {
    label: string;
    value: number | string;
    change?: number;
    icon?: string;
}

export const MacroItem: React.FC<MacroItemProps> = memo(({ label, value, change, icon }) => (
    <UltraCard
        variant="glass"
        glowColor="gold"
        noPadding
        className="min-w-[110px] shrink-0 cursor-pointer"
    >
        <div className="p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{icon}</span>
                <span className="text-[10px] text-white/50 font-medium">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white font-mono">
                    {typeof value === 'number' ? <AnimatedCounter value={value} decimals={2} /> : value}
                </span>
                {change !== undefined && (
                    <span className={`text-[9px] font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    </UltraCard>
));

MacroItem.displayName = 'MacroItem';

// ============================================================================
// Quick Add Chip
// ============================================================================

interface QuickAddChipProps {
    ticker: string;
    emoji: string;
    isAdded: boolean;
    onAdd: () => void;
    isLoading?: boolean;
}

export const QuickAddChip: React.FC<QuickAddChipProps> = memo(({ ticker, emoji, isAdded, onAdd, isLoading }) => (
    <button
        onClick={onAdd}
        disabled={isAdded || isLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 shrink-0 ${isAdded
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : isLoading
                ? 'bg-white/5 text-white/30 animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-purple-500/30 active:scale-95'
            }`}
    >
        <span>{emoji}</span>
        <span>{ticker}</span>
        {isAdded && <span className="text-[8px]">✓</span>}
    </button>
));

QuickAddChip.displayName = 'QuickAddChip';

// ============================================================================
// Skeleton Card
// ============================================================================

export const SkeletonCard: React.FC = () => (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/5 animate-pulse">
        <div className="flex justify-between mb-3">
            <div>
                <div className="h-5 w-14 bg-white/10 rounded mb-2" />
                <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
            <div className="text-left">
                <div className="h-5 w-16 bg-white/10 rounded mb-2" />
                <div className="h-3 w-10 bg-white/5 rounded" />
            </div>
        </div>
        <div className="h-8 w-full bg-white/5 rounded" />
    </div>
);

// ============================================================================
// Section Header
// ============================================================================

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle, action }) => (
    <div className="flex items-center justify-between mb-3 mt-5 px-1">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-purple-300">{icon}</div>
            <div>
                <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
                {subtitle && <p className="text-[10px] text-white/40 font-medium">{subtitle}</p>}
            </div>
        </div>
        {action}
    </div>
);
