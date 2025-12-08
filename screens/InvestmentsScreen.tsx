import React, { useState, useEffect, useCallback, memo } from 'react';
import type { FinancialAsset } from '../types';
import type { Screen } from '../types';
import * as dataService from '../services/dataService';
import * as financialsService from '../services/financialsService';
import { AddIcon, TrashIcon, ChartBarIcon, SparklesIcon } from '../components/icons';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import AssetDetailModal from '../components/AssetDetailModal';

// --- Helper Components ---

const MiniChart: React.FC<{ data?: number[]; isPositive: boolean }> = ({ data, isPositive }) => {
  if (!data || data.length < 2) {
    return <div className="h-12 w-24 bg-white/5 rounded-lg animate-pulse" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 38 - ((d - min) / range) * 36;
      return `${x},${y}`;
    })
    .join(' ');

  const color = isPositive ? '#4ADE80' : '#F87171';

  return (
    <svg width="100" height="40" viewBox="0 0 100 40" className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
      <polygon fill={`url(#gradient-${color})`} points={`0,40 ${points} 100,40`} opacity="0.5" />
    </svg>
  );
};

const AssetCard = memo(function AssetCard({
  asset,
  onRemove,
  onClick,
}: {
  asset: FinancialAsset;
  onRemove: () => void;
  onClick: () => void;
}) {
  const isPositive = (asset.change24h || 0) >= 0;
  const price =
    asset.price !== undefined
      ? asset.price.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: asset.price < 1 ? 6 : 2,
        })
      : '--';
  const change = asset.change24h !== undefined ? asset.change24h.toFixed(2) : '--';

  return (
    <div
      onClick={onClick}
      className="group relative themed-card p-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 border-l-4"
      style={{ borderLeftColor: isPositive ? '#4ADE80' : '#F87171' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight font-mono">
              {asset.ticker}
            </h3>
            <span className="text-[10px] text-secondary font-bold truncate max-w-[100px] uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded">
              {asset.name}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-medium text-white font-mono tracking-tight">
              ${price}
            </span>
          </div>
        </div>

        <div
          className={`flex flex-col items-end ${isPositive ? 'text-green-400' : 'text-red-400'}`}
        >
          <span className="text-sm font-bold font-mono bg-black/20 px-2 py-1 rounded-md shadow-inner">
            {isPositive ? '+' : ''}
            {change}%
          </span>
        </div>
      </div>

      <div className="h-12 flex items-end justify-between">
        <button
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-secondary hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100"
          aria-label={`הסר ${asset.name}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
        <div className="w-32 h-10 opacity-80 group-hover:opacity-100 transition-opacity">
          <MiniChart data={asset.sparkline} isPositive={isPositive} />
        </div>
      </div>
    </div>
  );
});

const SkeletonCard: React.FC = () => (
  <div className="themed-card p-5 shimmer-bg">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="h-6 w-16 bg-bg-secondary rounded-md mb-2"></div>
        <div className="h-8 w-32 bg-bg-secondary rounded-md"></div>
      </div>
      <div className="h-8 w-16 bg-bg-secondary rounded-md"></div>
    </div>
    <div className="mt-2 h-12 w-full bg-bg-secondary/50 rounded-lg"></div>
  </div>
);

// --- Main Screen Component ---

interface InvestmentsScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const InvestmentsScreen: React.FC<InvestmentsScreenProps> = ({ setActiveScreen }) => {
  const [watchlist, setWatchlist] = useState<FinancialAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<FinancialAsset | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: StatusMessageType;
    text: string;
    id: number;
  } | null>(null);

  const showStatus = (type: StatusMessageType, text: string) => {
    if (type === 'error' && window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
    setStatusMessage({ type, text, id: Date.now() });
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentWatchlist = await dataService.getWatchlist();
      const data = await financialsService.fetchWatchlistData(currentWatchlist);
      setWatchlist(data);
    } catch (error) {
      console.error('Failed to load watchlist data:', error);
      showStatus('error', 'שגיאה בטעינת נתוני השוק');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker || isAdding) return;
    setIsAdding(true);
    try {
      const newWatchlistItem = await dataService.addToWatchlist(newTicker);
      const newData = await financialsService.fetchWatchlistData([newWatchlistItem]);
      if (newData && newData.length > 0) {
        setWatchlist(prev => [newData[0] as FinancialAsset, ...prev]);
      }
      if (window.navigator.vibrate) window.navigator.vibrate(20);
      setNewTicker('');
      showStatus('success', `${newTicker.toUpperCase()} נוסף למעקב.`);
    } catch (error: any) {
      showStatus('error', error.message || 'שגיאה בהוספת נכס');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (ticker: string) => {
    if (window.navigator.vibrate) window.navigator.vibrate(20);
    await dataService.removeFromWatchlist(ticker);
    setWatchlist(prev => prev.filter(asset => asset.ticker !== ticker));
    showStatus('success', `${ticker} הוסר מהמעקב.`);
  };

  return (
    <div className="pt-4 pb-8 space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2 relative z-20">
        <input
          type="text"
          value={newTicker}
          onChange={e => setNewTicker(e.target.value.toUpperCase())}
          placeholder="הוסף סימול (למשל: TSLA, BTC)"
          className="glass-input w-full text-primary rounded-xl p-4 focus:outline-none font-mono uppercase placeholder:normal-case placeholder:font-sans"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="bg-[var(--accent-gradient)] text-white font-bold p-4 rounded-xl disabled:opacity-50 transition-transform transform active:scale-97 hover:brightness-110 shadow-lg shadow-[var(--dynamic-accent-start)]/30 hover:shadow-[0_0_15px_var(--dynamic-accent-glow)]"
        >
          {isAdding ? (
            <SparklesIcon className="w-6 h-6 animate-pulse" />
          ) : (
            <AddIcon className="w-6 h-6" />
          )}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        {!isLoading &&
          watchlist.map((asset, index) => (
            <div
              key={asset.ticker}
              className="animate-item-enter-fi"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AssetCard
                asset={asset}
                onRemove={() => handleRemove(asset.ticker)}
                onClick={() => setSelectedAsset(asset)}
              />
            </div>
          ))}
      </div>

      {!isLoading && watchlist.length === 0 && (
        <div className="text-center text-secondary mt-16 flex flex-col items-center">
          <ChartBarIcon className="w-20 h-20 text-muted mb-4" />
          <h2 className="font-bold text-xl text-white">רשימת המעקב ריקה</h2>
          <p className="max-w-xs mt-2">
            השתמש בטופס למעלה כדי להוסיף את המניות והמטבעות הראשונים שלך למעקב.
          </p>
        </div>
      )}

      {selectedAsset && (
        <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}

      {statusMessage && (
        <StatusMessage
          key={statusMessage.id}
          type={statusMessage.type}
          message={statusMessage.text}
          onDismiss={() => setStatusMessage(null)}
        />
      )}
    </div>
  );
};

export default InvestmentsScreen;
