#!/usr/bin/env node

// This script migrates user data from jsonstorage.net to Firebase Firestore
// Usage: node scripts/migrate-data.js <jsonstorage-bin-id>

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import fetch from 'node-fetch';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDZTnzkIQJL-HYVpUIpy4xUJMzEjro4PNc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "media1box.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "media1box",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "media1box.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "997690778625",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:997690778625:web:934ed44e12bfd20b9acc00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

/**
 * Fetch user data from jsonstorage.net
 */
async function fetchJsonStorageData(jsonStorageId) {
  try {
    console.log(`Fetching data from jsonstorage.net with ID: ${jsonStorageId}`);
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
}

/**
 * Migrate a single user from jsonstorage.net to Firebase
 */
async function migrateUser(jsonUser) {
  try {
    // Check if user already exists in Firestore
    const userRef = doc(firestore, 'users', jsonUser.id);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      console.log(`User ${jsonUser.id} already exists in Firestore. Skipping.`);
      return;
    }

    // Convert jsonstorage user to Firestore user
    const firestoreUser = {
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
}

/**
 * Migrate all users from jsonstorage.net to Firebase
 */
async function migrateAllUsers(jsonStorageId) {
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
    process.exit(1);
  }
}

// Main execution
(async () => {
  const jsonStorageId = process.argv[2];

  if (!jsonStorageId) {
    console.error('Please provide a jsonstorage.net bin ID as an argument.');
    console.error('Usage: node scripts/migrate-data.js <jsonstorage-bin-id>');
    process.exit(1);
  }

  try {
    await migrateAllUsers(jsonStorageId);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
