import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { WatchlistItem } from '../../types';
import {
    dbPut,
    dbDelete,
    initializeDefaultData,
    syncWithRetry
} from './indexedDBCore';
import {
    syncWatchlistItem,
    deleteWatchlistItem as deleteCloudWatchlistItem
} from '../firestoreService';
import { auth } from '../../config/firebase';
import { ValidationError } from '../errors';
import { findTicker } from '../financialsService';

const defaultWatchlist: WatchlistItem[] = [
    { id: 'bitcoin', name: 'Bitcoin', ticker: 'BTC', type: 'crypto' },
    { id: 'tsla', name: 'TSLA', ticker: 'TSLA', type: 'stock' },
];

export const getWatchlist = (): Promise<WatchlistItem[]> =>
    initializeDefaultData(LS.WATCHLIST, defaultWatchlist);

export const addToWatchlist = async (ticker: string): Promise<WatchlistItem> => {
    if (!ticker) throw new ValidationError('Ticker symbol is required.');
    const watchlist = await getWatchlist();
    const upperTicker = ticker.toUpperCase();
    if (watchlist.some(item => item.ticker === upperTicker))
        throw new Error(`${upperTicker} is already in the watchlist.`);
    const assetInfo = await findTicker(ticker);
    if (!assetInfo) throw new Error(`Could not find information for ticker: ${upperTicker}`);
    const newWatchlistItem: WatchlistItem = {
        id: assetInfo.id,
        name: assetInfo.name,
        ticker: upperTicker,
        type: assetInfo.type,
    };
    await dbPut(LS.WATCHLIST, newWatchlistItem);

    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(
            () => syncWatchlistItem(currentUser.uid, newWatchlistItem),
            `addToWatchlist:${newWatchlistItem.id}`
        );
    }
    return newWatchlistItem;
};

export const removeFromWatchlist = async (ticker: string): Promise<void> => {
    if (!ticker) throw new ValidationError('Ticker is required for removal.');
    const watchlist = await getWatchlist();
    const itemToRemove = watchlist.find(item => item.ticker === ticker.toUpperCase());
    if (itemToRemove) {
        await dbDelete(LS.WATCHLIST, itemToRemove.id);
        const currentUser = auth?.currentUser;
        if (currentUser) {
            syncWithRetry(
                () => deleteCloudWatchlistItem(currentUser.uid, itemToRemove.id),
                `removeFromWatchlist:${itemToRemove.id}`
            );
        }
    }
};
