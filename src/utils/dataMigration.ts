import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { User, WatchHistoryItem } from '../types/user';

/**
 * Interface for jsonstorage.net user data structure
 */
interface JsonStorageUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  favorites?: number[];
  watchHistory?: {
    id: number;
    title: string;
    poster_path: string;
    media_type: string;
    progress: number;
    lastWatched: string;
    season?: number;
    episode?: number;
  }[];
  settings?: {
    defaultSource?: string;
    preferredQuality?: string;
    preferredSubtitle?: string;
    autoplayEnabled?: boolean;
    mutedAutoplay?: boolean;
  };
}

/**
 * Fetch user data from jsonstorage.net
 * @param jsonStorageId The jsonstorage.net bin ID
 */
const fetchJsonStorageData = async (jsonStorageId: string): Promise<JsonStorageUser[]> => {
  try {
    const response = await fetch(`https://api.jsonstorage.net/v1/json/${jsonStorageId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching jsonstorage data:', error);
    throw error;
  }
};

/**
 * Migrate a single user from jsonstorage.net to Firebase
 */
const migrateUser = async (jsonUser: JsonStorageUser): Promise<void> => {
  try {
    // Check if user already exists in Firestore
    const userRef = doc(firestore, 'users', jsonUser.id);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`User ${jsonUser.id} already exists in Firestore. Skipping.`);
      return;
    }
    
    // Convert jsonstorage user to Firestore user
    const firestoreUser: User = {
      id: jsonUser.id,
      username: jsonUser.username,
      email: jsonUser.email,
      avatar: jsonUser.avatar || `https://ui-avatars.com/api/?name=${jsonUser.username}&background=random`,
      favorites: jsonUser.favorites || [],
      watchHistory: jsonUser.watchHistory || [],
      settings: {
        defaultSource: jsonUser.settings?.defaultSource || 'vidsrc.dev',
        preferredQuality: jsonUser.settings?.preferredQuality || '1080p',
        preferredSubtitle: jsonUser.settings?.preferredSubtitle || 'English',
        autoplayEnabled: jsonUser.settings?.autoplayEnabled !== false,
        mutedAutoplay: jsonUser.settings?.mutedAutoplay !== false
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Save user to Firestore
    await setDoc(userRef, firestoreUser);
    console.log(`User ${jsonUser.id} migrated successfully.`);
  } catch (error) {
    console.error(`Error migrating user ${jsonUser.id}:`, error);
    throw error;
  }
};

/**
 * Migrate all users from jsonstorage.net to Firebase
 */
export const migrateAllUsers = async (jsonStorageId: string): Promise<void> => {
  try {
    console.log('Starting user data migration...');
    
    // Fetch all users from jsonstorage.net
    const jsonUsers = await fetchJsonStorageData(jsonStorageId);
    console.log(`Found ${jsonUsers.length} users to migrate.`);
    
    // Migrate each user
    for (const jsonUser of jsonUsers) {
      await migrateUser(jsonUser);
    }
    
    console.log('User data migration completed successfully.');
  } catch (error) {
    console.error('Error during user data migration:', error);
    throw error;
  }
};

export default {
  migrateAllUsers
};
