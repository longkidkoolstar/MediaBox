import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDZTnzkIQJL-HYVpUIpy4xUJMzEjro4PNc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "media1box.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "media1box",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "media1box.appspot.com ",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "997690778625",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:997690778625:web:934ed44e12bfd20b9acc00",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YX8SJHMFKR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
// Set persistence to LOCAL (survives browser restarts)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Initialize Analytics conditionally (browser support check)
export const initAnalytics = async () => {
  try {
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      return getAnalytics(app);
    }
    return null;
  } catch (error) {
    console.error('Analytics initialization error:', error);
    return null;
  }
};

export default app;
