import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './src/config/firebase';
import AppNavigator  from './src/navigation/AppNavigator';
import LoginScreen   from './src/screens/LoginScreen';
import { useAppFonts } from './src/theme/useAppFonts';
import { color } from './src/theme/tokens';

// ─── Auth states ───────────────────────────────────────────────
// 'loading'  — Firebase is still restoring the session from storage.
//              Show a spinner; don't flash the login screen.
// 'authed'   — Valid Firebase user exists. Show the tab navigator.
// 'unauthed' — No user. Show the login screen.
type AuthState = 'loading' | 'authed' | 'unauthed';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [, setUser]              = useState<User | null>(null);
  const fontsReady               = useAppFonts();

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
  // Covers both the ~300ms Firebase takes to check storage for a cached
  // token and the Archivo load. Without it users see a flash of
  // LoginScreen when already signed in, and a flash of the fallback font.
  if (authState === 'loading' || !fontsReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color={color.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* ── Auth gate ── */}
      {authState === 'unauthed' ? <LoginScreen /> : <AppNavigator />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.bg,
  },
});
