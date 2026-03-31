/**
 * useAuth — returns the currently authenticated Firebase user.
 * Subscribes to auth state changes so the app reacts instantly on sign-in/sign-out.
 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

interface UseAuthResult {
  user: User | null;
  isLoadingAuth: boolean;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state — fires immediately with current user
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoadingAuth(false);
    });

    // Unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  return { user, isLoadingAuth };
}