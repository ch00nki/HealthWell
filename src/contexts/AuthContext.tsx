'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePresenceTracker } from './UserPresenceContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  usePresenceTracker();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Get the ID token and set it as a cookie
        const token = await getIdToken(user);
        document.cookie = `auth-token=${token}; path=/`;
      } else {
        // Remove the auth token cookie when logged out
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, role: string) => {
    try {      
      // Create the authentication user
      console.log('Creating authentication user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Auth user created successfully with UID:', userCredential.user.uid);
      
      try {
        // Create user document in Firestore
        console.log('Attempting to create Firestore document...');
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        
        const userData = {
          email: email,
          role: role,
        };
        console.log('Writing user data:', userData);
        
        await setDoc(userDocRef, userData);
        console.log('Firestore document created successfully');
      } catch (firestoreError: unknown) {
        console.error('Error creating user document:', firestoreError);

        // Try to delete the auth user if Firestore creation fails
        try {
          await userCredential.user.delete();
          console.log('Cleaned up auth user after Firestore error');
        } catch (deleteError: unknown) {
          console.error('Could not clean up auth user:', deleteError);
        }
        throw new Error('Failed to create user document. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Error in authentication signup:', error);
    }
  };

  const logOut = async () => {
      await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
