import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getCurrentUser } from '../services/authService';
import { getUserById } from '../services/userService';
import { User } from '../types/user';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUserData: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(getCurrentUser());
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      setIsLoading(true);

      if (user) {
        try {
          const userDoc = await getUserById(user.uid);
          setUserData(userDoc);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const userDoc = await getUserById(currentUser.uid);

        if (userDoc) {
          setUserData(userDoc);
        } else {
          // Create a new user document if it doesn't exist
          const newUserData = {
            id: currentUser.uid,
            email: currentUser.email || '',
            username: currentUser.displayName || 'User',
            avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=random`,
            favorites: [],
            watchLater: [],
            watchHistory: [],
            settings: {
              defaultSource: 'vidsrc.dev',
              preferredQuality: '1080p',
              preferredSubtitle: 'English',
              autoplayEnabled: true,
              mutedAutoplay: true
            }
          };

          // Import needed functions
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const { firestore } = await import('../lib/firebase');

          // Create the user document
          await setDoc(doc(firestore, 'users', currentUser.uid), {
            ...newUserData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          setUserData(newUserData as User);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const value = {
    currentUser,
    userData,
    isLoading,
    isAuthenticated: !!currentUser,
    setUserData,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
