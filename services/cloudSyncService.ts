/**
 * Cloud Sync Service
 * 
 * Manages real-time Firestore subscriptions for all user data.
 * Ensures data is loaded from the cloud when user signs in.
 */

import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
    subscribeToPersonalItems,
    subscribeToBodyWeight,
    subscribeToWorkoutSessions,
    subscribeToWorkoutTemplates,
    subscribeToSettings,
    subscribeToSpaces,
    subscribeToTags,
    subscribeToQuotes,
    subscribeToFeedItems,
    subscribeToTemplates,
    subscribeToWatchlist,
} from './firestoreService';
import {
    PersonalItem,
    BodyWeightEntry,
    WorkoutSession,
    WorkoutTemplate,
    AppSettings,
    Space,
    Tag,
    Quote,
    FeedItem,
    Template,
    WatchlistItem,
} from '../types';

// Type definitions for callback handlers
export interface CloudSyncCallbacks {
    onPersonalItemsUpdate?: (items: PersonalItem[]) => void;
    onBodyWeightUpdate?: (entries: BodyWeightEntry[]) => void;
    onWorkoutSessionsUpdate?: (sessions: WorkoutSession[]) => void;
    onWorkoutTemplatesUpdate?: (templates: WorkoutTemplate[]) => void;
    onSettingsUpdate?: (settings: AppSettings | null) => void;
    onSpacesUpdate?: (spaces: Space[]) => void;
    onTagsUpdate?: (tags: Tag[]) => void;
    onQuotesUpdate?: (quotes: Quote[]) => void;
    onFeedItemsUpdate?: (items: FeedItem[]) => void;
    onTemplatesUpdate?: (templates: Template[]) => void;
    onWatchlistUpdate?: (items: WatchlistItem[]) => void;
}

class CloudSyncService {
    private unsubscribeAuth: (() => void) | null = null;
    private unsubscribePersonalItems: (() => void) | null = null;
    private unsubscribeBodyWeight: (() => void) | null = null;
    private unsubscribeWorkoutSessions: (() => void) | null = null;
    private unsubscribeWorkoutTemplates: (() => void) | null = null;
    private unsubscribeSettings: (() => void) | null = null;
    private unsubscribeSpaces: (() => void) | null = null;
    private unsubscribeTags: (() => void) | null = null;
    private unsubscribeQuotes: (() => void) | null = null;
    private unsubscribeFeedItems: (() => void) | null = null;
    private unsubscribeTemplates: (() => void) | null = null;
    private unsubscribeWatchlist: (() => void) | null = null;
    private callbacks: CloudSyncCallbacks = {};
    private isInitialized = false;

    /**
     * Initialize the cloud sync service with callbacks for each data type.
     * Call this once when the app starts.
     */
    initialize(callbacks: CloudSyncCallbacks) {
        if (this.isInitialized) {
            console.warn('CloudSyncService: Already initialized, skipping.');
            return;
        }

        this.callbacks = callbacks;
        this.isInitialized = true;

        console.log('CloudSyncService: Initializing...');

        // Listen for auth state changes
        if (!auth) {
            console.warn('CloudSyncService: Firebase Auth not initialized');
            return;
        }

        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                this.startSubscriptions(user);
            } else {
                this.stopSubscriptions();
            }
        });
    }

    /**
     * Start all Firestore subscriptions for the authenticated user
     */
    private startSubscriptions(user: User) {
        console.log(`[CloudSyncService] Starting subscriptions for user: ${user.uid}`);

        // Personal Items
        if (this.callbacks.onPersonalItemsUpdate) {
            console.log('[CloudSyncService] Subscribing to Personal Items...');
            this.unsubscribePersonalItems = subscribeToPersonalItems(
                user.uid,
                (items) => {
                    console.log(`[CloudSyncService] Personal Items update received: ${items.length} items`);
                    this.callbacks.onPersonalItemsUpdate?.(items);
                }
            );
        }

        // Body Weight
        if (this.callbacks.onBodyWeightUpdate) {
            console.log('[CloudSyncService] Subscribing to Body Weight...');
            this.unsubscribeBodyWeight = subscribeToBodyWeight(
                user.uid,
                (entries) => {
                    console.log(`[CloudSyncService] Body Weight update received: ${entries.length} entries`);
                    this.callbacks.onBodyWeightUpdate?.(entries);
                }
            );
        }

        // Workout Sessions
        if (this.callbacks.onWorkoutSessionsUpdate) {
            console.log('[CloudSyncService] Subscribing to Workout Sessions...');
            this.unsubscribeWorkoutSessions = subscribeToWorkoutSessions(
                user.uid,
                (sessions) => {
                    console.log(`[CloudSyncService] Workout Sessions update received: ${sessions.length} sessions`);
                    this.callbacks.onWorkoutSessionsUpdate?.(sessions);
                }
            );
        }

        // Workout Templates
        if (this.callbacks.onWorkoutTemplatesUpdate) {
            console.log('[CloudSyncService] Subscribing to Workout Templates...');
            this.unsubscribeWorkoutTemplates = subscribeToWorkoutTemplates(
                user.uid,
                (templates) => {
                    console.log(`[CloudSyncService] Workout Templates update received: ${templates.length} templates`);
                    this.callbacks.onWorkoutTemplatesUpdate?.(templates);
                }
            );
        }

        // Settings
        if (this.callbacks.onSettingsUpdate) {
            console.log('[CloudSyncService] Subscribing to Settings...');
            this.unsubscribeSettings = subscribeToSettings(
                user.uid,
                (settings) => {
                    console.log('[CloudSyncService] Settings update received');
                    this.callbacks.onSettingsUpdate?.(settings);
                }
            );
        }

        // Spaces
        if (this.callbacks.onSpacesUpdate) {
            console.log('[CloudSyncService] Subscribing to Spaces...');
            this.unsubscribeSpaces = subscribeToSpaces(
                user.uid,
                (spaces) => {
                    console.log(`[CloudSyncService] Spaces update received: ${spaces.length} spaces`);
                    this.callbacks.onSpacesUpdate?.(spaces);
                }
            );
        }

        // Tags
        if (this.callbacks.onTagsUpdate) {
            console.log('[CloudSyncService] Subscribing to Tags...');
            this.unsubscribeTags = subscribeToTags(
                user.uid,
                (tags) => {
                    console.log(`[CloudSyncService] Tags update received: ${tags.length} tags`);
                    this.callbacks.onTagsUpdate?.(tags);
                }
            );
        }

        // Quotes
        if (this.callbacks.onQuotesUpdate) {
            console.log('[CloudSyncService] Subscribing to Quotes...');
            this.unsubscribeQuotes = subscribeToQuotes(
                user.uid,
                (quotes) => {
                    console.log(`[CloudSyncService] Quotes update received: ${quotes.length} quotes`);
                    this.callbacks.onQuotesUpdate?.(quotes);
                }
            );
        }

        // Feed Items
        if (this.callbacks.onFeedItemsUpdate) {
            console.log('[CloudSyncService] Subscribing to Feed Items...');
            this.unsubscribeFeedItems = subscribeToFeedItems(
                user.uid,
                (items) => {
                    console.log(`[CloudSyncService] Feed Items update received: ${items.length} items`);
                    this.callbacks.onFeedItemsUpdate?.(items);
                }
            );
        }

        // Templates
        if (this.callbacks.onTemplatesUpdate) {
            console.log('[CloudSyncService] Subscribing to Templates...');
            this.unsubscribeTemplates = subscribeToTemplates(
                user.uid,
                (templates) => {
                    console.log(`[CloudSyncService] Templates update received: ${templates.length} templates`);
                    this.callbacks.onTemplatesUpdate?.(templates);
                }
            );
        }

        // Watchlist
        if (this.callbacks.onWatchlistUpdate) {
            console.log('[CloudSyncService] Subscribing to Watchlist...');
            this.unsubscribeWatchlist = subscribeToWatchlist(
                user.uid,
                (items) => {
                    console.log(`[CloudSyncService] Watchlist update received: ${items.length} items`);
                    this.callbacks.onWatchlistUpdate?.(items);
                }
            );
        }

        console.log('[CloudSyncService] All subscriptions started');
    }

    /**
     * Stop all Firestore subscriptions
     */
    private stopSubscriptions() {
        console.log('[CloudSyncService] Stopping subscriptions');

        if (this.unsubscribePersonalItems) {
            this.unsubscribePersonalItems();
            this.unsubscribePersonalItems = null;
        }
        if (this.unsubscribeBodyWeight) {
            this.unsubscribeBodyWeight();
            this.unsubscribeBodyWeight = null;
        }
        if (this.unsubscribeWorkoutSessions) {
            this.unsubscribeWorkoutSessions();
            this.unsubscribeWorkoutSessions = null;
        }
        if (this.unsubscribeWorkoutTemplates) {
            this.unsubscribeWorkoutTemplates();
            this.unsubscribeWorkoutTemplates = null;
        }
        if (this.unsubscribeSettings) {
            this.unsubscribeSettings();
            this.unsubscribeSettings = null;
        }
        if (this.unsubscribeSpaces) {
            this.unsubscribeSpaces();
            this.unsubscribeSpaces = null;
        }
        if (this.unsubscribeTags) {
            this.unsubscribeTags();
            this.unsubscribeTags = null;
        }
        if (this.unsubscribeQuotes) {
            this.unsubscribeQuotes();
            this.unsubscribeQuotes = null;
        }
        if (this.unsubscribeFeedItems) {
            this.unsubscribeFeedItems();
            this.unsubscribeFeedItems = null;
        }
        if (this.unsubscribeTemplates) {
            this.unsubscribeTemplates();
            this.unsubscribeTemplates = null;
        }
        if (this.unsubscribeWatchlist) {
            this.unsubscribeWatchlist();
            this.unsubscribeWatchlist = null;
        }
    }

    /**
     * Cleanup the service (call on app unmount if needed)
     */
    cleanup() {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
            this.unsubscribeAuth = null;
        }
        this.stopSubscriptions();
        this.isInitialized = false;
        console.log('[CloudSyncService] Cleaned up');
    }
}

export const cloudSyncService = new CloudSyncService();
