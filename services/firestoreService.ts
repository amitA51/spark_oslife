import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  writeBatch,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PersonalItem, EventLog, AppSettings } from '../types';

// Persistence is now configured in firebase.ts using persistentLocalCache

// --- Collection References ---

const getUserRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', userId);
};
const getPersonalItemsRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/personalItems`);
};
const getEventLogRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/eventLog`);
};

// --- Sync Operations ---

/**
 * Sync a single PersonalItem to Firestore
 */
export const syncPersonalItem = async (userId: string, item: PersonalItem) => {
  try {
    const docRef = doc(getPersonalItemsRef(userId), item.id);
    await setDoc(
      docRef,
      {
        ...item,
        updatedAt: Timestamp.now(),
        _synced: true,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error syncing personal item:', error);
    throw error;
  }
};

/**
 * Sync a batch of PersonalItems
 */
export const syncBatchPersonalItems = async (userId: string, items: PersonalItem[]) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping batch sync');
    return;
  }
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const docRef = doc(getPersonalItemsRef(userId), item.id);
      batch.set(
        docRef,
        {
          ...item,
          updatedAt: Timestamp.now(),
          _synced: true,
        },
        { merge: true }
      );
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
  if (!db) {
    console.warn('Firestore not initialized, skipping delete');
    return;
  }
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
export const subscribeToPersonalItems = (
  userId: string,
  callback: (items: PersonalItem[]) => void
) => {
  const q = query(getPersonalItemsRef(userId));

  return onSnapshot(
    q,
    snapshot => {
      const items: PersonalItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Convert timestamps back to strings/dates if needed
        items.push({ ...data, id: doc.id } as PersonalItem);
      });
      callback(items);
    },
    error => {
      console.error('Error in personal items subscription:', error);
    }
  );
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
      userId,
    });
  } catch (error) {
    console.error('Error syncing event log:', error);
  }
};

/**
 * Initialize User Data (First time setup)
 */
export const initializeUserDocument = async (
  userId: string,
  email: string | null,
  displayName: string | null
) => {
  const userRef = getUserRef(userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email,
      displayName,
      createdAt: Timestamp.now(),
      settings: {
        // Default settings will be merged
      },
    });
  }
};

// --- Settings Sync ---

/**
 * Save user settings to Firestore
 */
export const syncSettings = async (userId: string, settings: AppSettings) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping settings sync');
    return;
  }
  try {
    const userRef = getUserRef(userId);
    await setDoc(
      userRef,
      {
        settings: settings,
        settingsUpdatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error syncing settings:', error);
    throw error;
  }
};

/**
 * Get settings from Firestore
 */
export const getCloudSettings = async (userId: string): Promise<AppSettings | null> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot get cloud settings');
    return null;
  }
  try {
    const userRef = getUserRef(userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data()?.settings || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting cloud settings:', error);
    return null;
  }
};

/**
 * Subscribe to settings changes (real-time)
 */
export const subscribeToSettings = (
  userId: string,
  callback: (settings: AppSettings | null) => void
) => {
  if (!db) {
    console.warn('Firestore not initialized, cannot subscribe to settings');
    return () => { };
  }
  const userRef = getUserRef(userId);

  return onSnapshot(
    userRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(docSnapshot.data()?.settings || null);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in settings subscription:', error);
    }
  );
};
