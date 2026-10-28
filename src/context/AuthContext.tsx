import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from '../lib/firebase';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'candidate' | 'examiner' | 'admin';
  targetBand?: string;
  createdAt: string;
  updatedAt?: string;
}

export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected authentication error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is not valid. Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This candidate account has been suspended. Please contact the test center administrator.';
    case 'auth/user-not-found':
      return 'No registered account found with this email. Please check your spelling or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify your credentials and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is currently pending activation in the Firebase Console (Authentication > Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access is temporarily suspended. Please wait a few moments and try again.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup window was closed before completion.';
    default:
      if (err.message && err.message.length > 0 && !err.message.includes('Firebase:')) {
        return err.message;
      }
      return 'Authentication could not be completed. Please verify your entries and try again.';
  }
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string, targetBand?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateTargetBand: (band: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Self-registration is strictly restricted to candidate role
            const newProfile: UserProfile = {
              id: currentUser.uid,
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Candidate',
              role: 'candidate', // strict security invariant: never admin
              targetBand: '7.5',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Email & Password Sign In
  const signInWithEmail = async (emailInput: string, passwordInput: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  // 2. Email & Password Registration
  const signUpWithEmail = async (
    emailInput: string,
    passwordInput: string,
    displayNameInput?: string,
    targetBandInput?: string
  ) => {
    setAuthError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      const chosenName = displayNameInput?.trim() || 'Candidate';
      
      // Update Firebase Auth displayName
      try {
        await updateProfile(res.user, { displayName: chosenName });
      } catch {
        // Non-critical profile update failure
      }

      // Bootstrap candidate profile in Firestore with role: 'candidate'
      const userDocRef = doc(db, 'users', res.user.uid);
      const newProfile: UserProfile = {
        id: res.user.uid,
        uid: res.user.uid,
        email: res.user.email || emailInput.trim(),
        displayName: chosenName,
        role: 'candidate', // security invariant: never assign admin on client
        targetBand: targetBandInput || '7.5',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  // 3. Google Sign In
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  // 4. Sign Out
  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      setProfile(null);
    } catch (err: unknown) {
      console.error('Sign Out error:', err);
      throw err;
    }
  };

  // 5. Update Target Band
  const updateTargetBand = async (band: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const updatedAt = new Date().toISOString();
      await updateDoc(userDocRef, { targetBand: band, updatedAt });
      setProfile((prev) => (prev ? { ...prev, targetBand: band, updatedAt } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        clearAuthError,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateTargetBand,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
