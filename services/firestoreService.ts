import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    writeBatch,
    onSnapshot,
    enableIndexedDbPersistence,
    Timestamp,
    DocumentData
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { PersonalItem, FeedItem, EventLog } from '../types';

// Enable offline persistence
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistence failed: Browser not supported');
        }
    });
} catch (e) {
    console.warn('Persistence setup error:', e);
}

// --- Collection References ---

const getUserRef = (userId: string) => doc(db, 'users', userId);
const getPersonalItemsRef = (userId: string) => collection(db, `users/${userId}/personalItems`);
const getFeedItemsRef = (userId: string) => collection(db, `users/${userId}/feedItems`);
const getEventLogRef = (userId: string) => collection(db, `users/${userId}/eventLog`);

// --- Sync Operations ---

/**
 * Sync a single PersonalItem to Firestore
 */
export const syncPersonalItem = async (userId: string, item: PersonalItem) => {
    try {
        const docRef = doc(getPersonalItemsRef(userId), item.id);
        await setDoc(docRef, {
            ...item,
            updatedAt: Timestamp.now(),
            _synced: true
        }, { merge: true });
    } catch (error) {
        console.error('Error syncing personal item:', error);
        throw error;
    }
};

/**
 * Sync a batch of PersonalItems
 */
export const syncBatchPersonalItems = async (userId: string, items: PersonalItem[]) => {
    try {
        const batch = writeBatch(db);
        items.forEach(item => {
            const docRef = doc(getPersonalItemsRef(userId), item.id);
            batch.set(docRef, {
                ...item,
                updatedAt: Timestamp.now(),
                _synced: true
            }, { merge: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error batch syncing items:', error);
        throw error;
    }
};

/**
 * Delete a PersonalItem from Firestore
 */
export const deletePersonalItem = async (userId: string, itemId: string) => {
    try {
        const batch = writeBatch(db);
        const docRef = doc(getPersonalItemsRef(userId), itemId);
        batch.delete(docRef);
        await batch.commit();
    } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
};

/**
 * Real-time listener for PersonalItems
 */
export const subscribeToPersonalItems = (userId: string, callback: (items: PersonalItem[]) => void) => {
    const q = query(getPersonalItemsRef(userId));

    return onSnapshot(q, (snapshot) => {
        const items: PersonalItem[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert timestamps back to strings/dates if needed
            items.push({ ...data, id: doc.id } as PersonalItem);
        });
        callback(items);
    }, (error) => {
        console.error('Error in personal items subscription:', error);
    });
};

/**
 * Sync Event Log
 */
export const syncEventLog = async (userId: string, event: EventLog) => {
    try {
        const docRef = doc(getEventLogRef(userId), event.id);
        await setDoc(docRef, {
            ...event,
            timestamp: Timestamp.fromDate(new Date(event.timestamp)),
            userId
        });
    } catch (error) {
        console.error('Error syncing event log:', error);
    }
};

/**
 * Initialize User Data (First time setup)
 */
export const initializeUserDocument = async (userId: string, email: string | null, displayName: string | null) => {
    const userRef = getUserRef(userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email,
            displayName,
            createdAt: Timestamp.now(),
            settings: {
                // Default settings will be merged
            }
        });
    }
};
