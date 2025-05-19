import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  User as FirebaseUser,
  UserCredential,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore, googleProvider, facebookProvider } from '../lib/firebase';
import { User } from '../types/user';

/**
 * Register a new user with email and password
 */
export const registerWithEmailAndPassword = async (
  email: string,
  password: string,
  username: string
): Promise<User> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update profile with username
    await updateProfile(firebaseUser, {
      displayName: username
    });

    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: username,
      avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${username}&background=random`,
      favorites: [],
      watchLater: [],
      watchHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: {
        defaultSource: 'vidsrc.dev',
        preferredQuality: '1080p',
        preferredSubtitle: 'English',
        autoplayEnabled: true,
        mutedAutoplay: true
      }
    };

    await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);

    return userData;
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw new Error(error.message || 'Failed to register user');
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Check if this is a new user
    const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));

    if (!userDoc.exists()) {
      // Create user document for new Google sign-in users
      const userData: User = {
        id: result.user.uid,
        email: result.user.email || '',
        username: result.user.displayName || 'User',
        avatar: result.user.photoURL || `https://ui-avatars.com/api/?name=${result.user.displayName}&background=random`,
        favorites: [],
        watchLater: [],
        watchHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          defaultSource: 'vidsrc.dev',
          preferredQuality: '1080p',
          preferredSubtitle: 'English',
          autoplayEnabled: true,
          mutedAutoplay: true
        }
      };

      await setDoc(doc(firestore, 'users', result.user.uid), userData);
    }

    return result;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

/**
 * Sign in with Facebook
 */
export const signInWithFacebook = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);

    // Check if this is a new user
    const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));

    if (!userDoc.exists()) {
      // Create user document for new Facebook sign-in users
      const userData: User = {
        id: result.user.uid,
        email: result.user.email || '',
        username: result.user.displayName || 'User',
        avatar: result.user.photoURL || `https://ui-avatars.com/api/?name=${result.user.displayName}&background=random`,
        favorites: [],
        watchLater: [],
        watchHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          defaultSource: 'vidsrc.dev',
          preferredQuality: '1080p',
          preferredSubtitle: 'English',
          autoplayEnabled: true,
          mutedAutoplay: true
        }
      };

      await setDoc(doc(firestore, 'users', result.user.uid), userData);
    }

    return result;
  } catch (error: any) {
    console.error('Error signing in with Facebook:', error);
    throw new Error(error.message || 'Failed to sign in with Facebook');
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
