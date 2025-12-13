import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  writeBatch,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  PersonalItem,
  EventLog,
  AppSettings,
  BodyWeightEntry,
  WorkoutSession,
  WorkoutTemplate,
  Space,
  Tag,
  Quote,
  FeedItem,
  Template,
  WatchlistItem,
} from '../types';

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
const getBodyWeightRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/bodyWeight`);
};
const getWorkoutSessionsRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/workoutSessions`);
};
const getWorkoutTemplatesRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/workoutTemplates`);
};
const getSpacesRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/spaces`);
};
const getTagsRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/tags`);
};
const getQuotesRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/quotes`);
};
const getFeedItemsRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/feedItems`);
};
const getTemplatesRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/templates`);
};
const getWatchlistRef = (userId: string) => {
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, `users/${userId}/watchlist`);
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

// --- Body Weight Sync ---

/**
 * Sync a body weight entry to Firestore
 */
export const syncBodyWeight = async (userId: string, entry: BodyWeightEntry) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping body weight sync');
    return;
  }
  try {
    const docRef = doc(getBodyWeightRef(userId), entry.id);
    await setDoc(
      docRef,
      {
        ...entry,
        _synced: true,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error syncing body weight:', error);
    throw error;
  }
};

/**
 * Delete a body weight entry from Firestore
 */
export const deleteBodyWeight = async (userId: string, entryId: string) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping delete');
    return;
  }
  try {
    const docRef = doc(getBodyWeightRef(userId), entryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting body weight:', error);
    throw error;
  }
};

/**
 * Subscribe to body weight changes (real-time)
 */
export const subscribeToBodyWeight = (
  userId: string,
  callback: (entries: BodyWeightEntry[]) => void
) => {
  if (!db) {
    console.warn('Firestore not initialized, cannot subscribe to body weight');
    return () => { };
  }
  const q = query(getBodyWeightRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: BodyWeightEntry[] = [];
      snapshot.forEach(doc => {
        entries.push({ ...doc.data(), id: doc.id } as BodyWeightEntry);
      });
      callback(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    (error) => {
      console.error('Error in body weight subscription:', error);
    }
  );
};

// --- Workout Sessions Sync ---

/**
 * Sync a workout session to Firestore
 */
export const syncWorkoutSession = async (userId: string, session: WorkoutSession) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping workout session sync');
    return;
  }
  try {
    const docRef = doc(getWorkoutSessionsRef(userId), session.id);
    await setDoc(
      docRef,
      {
        ...session,
        startTime: session.startTime,
        endTime: session.endTime,
        _synced: true,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error syncing workout session:', error);
    throw error;
  }
};

/**
 * Delete a workout session from Firestore
 */
export const deleteWorkoutSession = async (userId: string, sessionId: string) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping delete');
    return;
  }
  try {
    const docRef = doc(getWorkoutSessionsRef(userId), sessionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting workout session:', error);
    throw error;
  }
};

/**
 * Subscribe to workout session changes (real-time)
 */
export const subscribeToWorkoutSessions = (
  userId: string,
  callback: (sessions: WorkoutSession[]) => void
) => {
  if (!db) {
    console.warn('Firestore not initialized, cannot subscribe to workout sessions');
    return () => { };
  }
  const q = query(getWorkoutSessionsRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: WorkoutSession[] = [];
      snapshot.forEach(doc => {
        sessions.push({ ...doc.data(), id: doc.id } as WorkoutSession);
      });
      callback(sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    },
    (error) => {
      console.error('Error in workout sessions subscription:', error);
    }
  );
};

// --- Workout Templates Sync ---

/**
 * Sync a workout template to Firestore
 */
export const syncWorkoutTemplate = async (userId: string, template: WorkoutTemplate) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping workout template sync');
    return;
  }
  try {
    const docRef = doc(getWorkoutTemplatesRef(userId), template.id);
    await setDoc(
      docRef,
      {
        ...template,
        _synced: true,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error syncing workout template:', error);
    throw error;
  }
};

/**
 * Delete a workout template from Firestore
 */
export const deleteWorkoutTemplate = async (userId: string, templateId: string) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping delete');
    return;
  }
  try {
    const docRef = doc(getWorkoutTemplatesRef(userId), templateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting workout template:', error);
    throw error;
  }
};

/**
 * Subscribe to workout template changes (real-time)
 */
export const subscribeToWorkoutTemplates = (
  userId: string,
  callback: (templates: WorkoutTemplate[]) => void
) => {
  if (!db) {
    console.warn('Firestore not initialized, cannot subscribe to workout templates');
    return () => { };
  }
  const q = query(getWorkoutTemplatesRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const templates: WorkoutTemplate[] = [];
      snapshot.forEach(doc => {
        templates.push({ ...doc.data(), id: doc.id } as WorkoutTemplate);
      });
      callback(templates);
    },
    (error) => {
      console.error('Error in workout templates subscription:', error);
    }
  );
};

// --- Spaces Sync ---

/**
 * Sync a space to Firestore
 */
export const syncSpace = async (userId: string, space: Space) => {
  if (!db) {
    console.warn('Firestore not initialized, skipping space sync');
    return;
  }
  try {
    const docRef = doc(getSpacesRef(userId), space.id);
    await setDoc(
      docRef,
      { ...space, _synced: true },
      { merge: true }
    );
  } catch (error) {
    console.error('Error syncing space:', error);
    throw error;
  }
};

/**
 * Delete a space from Firestore
 */
export const deleteSpace = async (userId: string, spaceId: string) => {
  if (!db) return;
  try {
    const docRef = doc(getSpacesRef(userId), spaceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting space:', error);
    throw error;
  }
};

/**
 * Subscribe to spaces changes (real-time)
 */
export const subscribeToSpaces = (
  userId: string,
  callback: (spaces: Space[]) => void
) => {
  if (!db) {
    console.warn('Firestore not initialized, cannot subscribe to spaces');
    return () => { };
  }
  const q = query(getSpacesRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const spaces: Space[] = [];
      snapshot.forEach(d => {
        spaces.push({ ...d.data(), id: d.id } as Space);
      });
      callback(spaces.sort((a, b) => a.order - b.order));
    },
    (error) => {
      console.error('Error in spaces subscription:', error);
    }
  );
};

// --- Tags Sync ---

/**
 * Sync a tag to Firestore
 */
export const syncTag = async (userId: string, tag: Tag) => {
  if (!db) return;
  try {
    const docRef = doc(getTagsRef(userId), tag.id);
    await setDoc(docRef, { ...tag, _synced: true }, { merge: true });
  } catch (error) {
    console.error('Error syncing tag:', error);
    throw error;
  }
};

/**
 * Delete a tag from Firestore
 */
export const deleteTag = async (userId: string, tagId: string) => {
  if (!db) return;
  try {
    const docRef = doc(getTagsRef(userId), tagId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

/**
 * Subscribe to tags changes (real-time)
 */
export const subscribeToTags = (
  userId: string,
  callback: (tags: Tag[]) => void
) => {
  if (!db) return () => { };
  const q = query(getTagsRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const tags: Tag[] = [];
      snapshot.forEach(d => {
        tags.push({ ...d.data(), id: d.id } as Tag);
      });
      callback(tags);
    },
    (error) => {
      console.error('Error in tags subscription:', error);
    }
  );
};

// --- Quotes Sync ---

/**
 * Sync a quote to Firestore
 */
export const syncQuote = async (userId: string, quote: Quote) => {
  if (!db) return;
  try {
    const docRef = doc(getQuotesRef(userId), quote.id);
    await setDoc(docRef, { ...quote, _synced: true }, { merge: true });
  } catch (error) {
    console.error('Error syncing quote:', error);
    throw error;
  }
};

/**
 * Delete a quote from Firestore
 */
export const deleteQuote = async (userId: string, quoteId: string) => {
  if (!db) return;
  try {
    const docRef = doc(getQuotesRef(userId), quoteId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
};

/**
 * Subscribe to quotes changes (real-time)
 */
export const subscribeToQuotes = (
  userId: string,
  callback: (quotes: Quote[]) => void
) => {
  if (!db) return () => { };
  const q = query(getQuotesRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const quotes: Quote[] = [];
      snapshot.forEach(d => {
        quotes.push({ ...d.data(), id: d.id } as Quote);
      });
      callback(quotes);
    },
    (error) => {
      console.error('Error in quotes subscription:', error);
    }
  );
};

// --- FeedItems Sync ---

/**
 * Sync a feed item to Firestore
 */
export const syncFeedItem = async (userId: string, item: FeedItem) => {
  if (!db) return;
  try {
    const docRef = doc(getFeedItemsRef(userId), item.id);
    await setDoc(docRef, { ...item, _synced: true }, { merge: true });
  } catch (error) {
    console.error('Error syncing feed item:', error);
    throw error;
  }
};

/**
 * Delete a feed item from Firestore
 */
export const deleteFeedItem = async (userId: string, itemId: string) => {
  if (!db) return;
  try {
    const docRef = doc(getFeedItemsRef(userId), itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting feed item:', error);
    throw error;
  }
};

/**
 * Subscribe to feed items changes (real-time)
 */
export const subscribeToFeedItems = (
  userId: string,
  callback: (items: FeedItem[]) => void
) => {
  if (!db) return () => { };
  const q = query(getFeedItemsRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FeedItem[] = [];
      snapshot.forEach(d => {
        items.push({ ...d.data(), id: d.id } as FeedItem);
      });
      callback(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    (error) => {
      console.error('Error in feed items subscription:', error);
    }
  );
};

// --- Templates Sync ---

/**
 * Sync a template to Firestore
 */
export const syncTemplate = async (userId: string, template: Template) => {
  if (!db) return;
  try {
    const docRef = doc(getTemplatesRef(userId), template.id);
    await setDoc(docRef, { ...template, _synced: true }, { merge: true });
  } catch (error) {
    console.error('Error syncing template:', error);
    throw error;
  }
};

/**
 * Delete a template from Firestore
 */
export const deleteTemplate = async (userId: string, templateId: string) => {
  if (!db) return;
  try {
    const docRef = doc(getTemplatesRef(userId), templateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

/**
 * Subscribe to templates changes (real-time)
 */
export const subscribeToTemplates = (
  userId: string,
  callback: (templates: Template[]) => void
) => {
  if (!db) return () => { };
  const q = query(getTemplatesRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const templates: Template[] = [];
      snapshot.forEach(d => {
        templates.push({ ...d.data(), id: d.id } as Template);
      });
      callback(templates);
    },
    (error) => {
      console.error('Error in templates subscription:', error);
    }
  );
};

// --- Watchlist Sync ---

/**
 * Sync a watchlist item to Firestore
 */
export const syncWatchlistItem = async (userId: string, item: WatchlistItem) => {
  if (!db) return;
  try {
    const docRef = doc(getWatchlistRef(userId), item.id);
    await setDoc(docRef, { ...item, _synced: true }, { merge: true });
  } catch (error) {
    console.error('Error syncing watchlist item:', error);
    throw error;
  }
};

/**
 * Delete a watchlist item from Firestore
 */
export const deleteWatchlistItem = async (userId: string, itemId: string) => {
  if (!db) return;
  try {
    const docRef = doc(getWatchlistRef(userId), itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting watchlist item:', error);
    throw error;
  }
};

/**
 * Subscribe to watchlist changes (real-time)
 */
export const subscribeToWatchlist = (
  userId: string,
  callback: (items: WatchlistItem[]) => void
) => {
  if (!db) return () => { };
  const q = query(getWatchlistRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: WatchlistItem[] = [];
      snapshot.forEach(d => {
        items.push({ ...d.data(), id: d.id } as WatchlistItem);
      });
      callback(items);
    },
    (error) => {
      console.error('Error in watchlist subscription:', error);
    }
  );
};
