import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './src/config/firebase';
import AppNavigator  from './src/navigation/AppNavigator';
import LoginScreen   from './src/screens/LoginScreen';

// ─── Auth states ───────────────────────────────────────────────
// 'loading'  — Firebase is still restoring the session from storage.
//              Show a spinner; don't flash the login screen.
// 'authed'   — Valid Firebase user exists. Show the tab navigator.
// 'unauthed' — No user. Show the login screen.
type AuthState = 'loading' | 'authed' | 'unauthed';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser]           = useState<User | null>(null);

  useEffect(() => {
    // onAuthStateChanged fires immediately with the cached session
    // (or null if not signed in). The unsubscribe function prevents
    // memory leaks when the component unmounts.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthState(firebaseUser ? 'authed' : 'unauthed');
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  // ── Loading splash ─────────────────────────────────────────────
  // Shown for ~300ms while Firebase checks AsyncStorage for a
  // cached token. Without this, users see a flash of LoginScreen
  // even when they're already signed in.
  if (authState === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  // ── Auth gate ──────────────────────────────────────────────────
  if (authState === 'unauthed') {
    return <LoginScreen />;
  }

  // ── Authenticated: show the app ────────────────────────────────
  return <AppNavigator />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});