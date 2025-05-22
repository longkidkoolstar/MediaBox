import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { User, WatchHistoryItem, UserSettings } from '../types/user';

/**
 * Get user data by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as User;
    }

    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: { username?: string; avatar?: string }
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      'settings': settings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

/**
 * Add media to favorites
 */
export const addToFavorites = async (
  userId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'anime'
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const favoriteItem = { id: mediaId, media_type: mediaType };

    await updateDoc(userRef, {
      favorites: arrayUnion(favoriteItem),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Remove media from favorites
 */
export const removeFromFavorites = async (
  userId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'anime'
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const favoriteItem = { id: mediaId, media_type: mediaType };

    await updateDoc(userRef, {
      favorites: arrayRemove(favoriteItem),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Add or update watch history item
 */
export const updateWatchHistory = async (
  userId: string,
  historyItem: WatchHistoryItem
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const watchHistory = userData.watchHistory || [];

      // Check if item already exists in history
      const existingItemIndex = watchHistory.findIndex(
        item => item.id === historyItem.id && item.media_type === historyItem.media_type
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        watchHistory[existingItemIndex] = {
          ...watchHistory[existingItemIndex],
          ...historyItem,
          lastWatched: new Date().toISOString()
        };
      } else {
        // Add new item
        watchHistory.push({
          ...historyItem,
          lastWatched: new Date().toISOString()
        });
      }

      // Keep only the most recent 50 items
      const sortedHistory = watchHistory
        .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
        .slice(0, 50);

      await updateDoc(userRef, {
        watchHistory: sortedHistory,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating watch history:', error);
    throw error;
  }
};

/**
 * Remove item from watch history
 */
export const removeFromWatchHistory = async (
  userId: string,
  mediaId: number,
  mediaType: string
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const watchHistory = userData.watchHistory || [];

      const updatedHistory = watchHistory.filter(
        item => !(item.id === mediaId && item.media_type === mediaType)
      );

      await updateDoc(userRef, {
        watchHistory: updatedHistory,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error removing from watch history:', error);
    throw error;
  }
};

/**
 * Clear entire watch history
 */
export const clearWatchHistory = async (
  userId: string
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      watchHistory: [],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error clearing watch history:', error);
    throw error;
  }
};

/**
 * Add media to watch later list
 */
export const addToWatchLater = async (
  userId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'anime'
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const watchLaterItem = { id: mediaId, media_type: mediaType };

    await updateDoc(userRef, {
      watchLater: arrayUnion(watchLaterItem),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding to watch later:', error);
    throw error;
  }
};

/**
 * Remove media from watch later list
 */
export const removeFromWatchLater = async (
  userId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'anime'
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const watchLaterItem = { id: mediaId, media_type: mediaType };

    await updateDoc(userRef, {
      watchLater: arrayRemove(watchLaterItem),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing from watch later:', error);
    throw error;
  }
};

/**
 * Clear entire watch later list
 */
export const clearWatchLater = async (
  userId: string
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      watchLater: [],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error clearing watch later list:', error);
    throw error;
  }
};

/**
 * Create a custom list for a user
 */
export const createCustomList = async (
  userId: string,
  listName: string,
  description: string = ''
): Promise<string> => {
  try {
    const listRef = doc(collection(firestore, 'lists'));
    const listId = listRef.id;

    await setDoc(listRef, {
      id: listId,
      userId,
      name: listName,
      description,
      items: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return listId;
  } catch (error) {
    console.error('Error creating custom list:', error);
    throw error;
  }
};

/**
 * Get all custom lists for a user
 */
export const getUserLists = async (userId: string) => {
  try {
    const listsQuery = query(
      collection(firestore, 'lists'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(listsQuery);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting user lists:', error);
    throw error;
  }
};
