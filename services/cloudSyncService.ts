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
} from './firestoreService';
import { PersonalItem, BodyWeightEntry, WorkoutSession, WorkoutTemplate } from '../types';

// Type definitions for callback handlers
export interface CloudSyncCallbacks {
    onPersonalItemsUpdate?: (items: PersonalItem[]) => void;
    onBodyWeightUpdate?: (entries: BodyWeightEntry[]) => void;
    onWorkoutSessionsUpdate?: (sessions: WorkoutSession[]) => void;
    onWorkoutTemplatesUpdate?: (templates: WorkoutTemplate[]) => void;
}

class CloudSyncService {
    private unsubscribeAuth: (() => void) | null = null;
    private unsubscribePersonalItems: (() => void) | null = null;
    private unsubscribeBodyWeight: (() => void) | null = null;
    private unsubscribeWorkoutSessions: (() => void) | null = null;
    private unsubscribeWorkoutTemplates: (() => void) | null = null;
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
        } else {
            console.log('[CloudSyncService] No callback for Personal Items');
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
