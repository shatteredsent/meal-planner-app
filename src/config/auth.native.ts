/**
 * Auth for iOS and Android.
 *
 * Without an explicit persistence Firebase falls back to in-memory and logs
 * "You are initializing Firebase Auth for React Native without providing
 * AsyncStorage" — and the user is signed out every time the app restarts.
 * Wiring AsyncStorage in fixes both.
 *
 * The web variant is ./auth.ts; Metro picks this file on native.
 */
import * as firebaseAuth from 'firebase/auth';
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from './firebaseApp';

/**
 * `getReactNativePersistence` is real at runtime but invisible to TypeScript.
 *
 * @firebase/auth's `exports` map sends the `react-native` condition to
 * `dist/rn` — which does export it, and which Metro resolves here. TypeScript
 * instead follows the package's default `types` entry (`auth-public.d.ts`),
 * where it is absent. Reaching for it through a narrowly-typed view of the
 * module keeps the call site honest without overriding Firebase's own types or
 * changing module resolution project-wide.
 */
type AsyncStorageLike = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
};

const { getReactNativePersistence } = firebaseAuth as unknown as {
  getReactNativePersistence?: (storage: AsyncStorageLike) => Persistence;
};

function createAuth(): Auth {
  // If a future Firebase release drops or renames the export, fall back to a
  // working (if non-persistent) Auth rather than crashing on launch.
  if (!getReactNativePersistence) {
    console.warn(
      '[firebase] getReactNativePersistence unavailable — auth will not persist between launches.'
    );
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh can re-run this module against an app that already has an
    // Auth instance; initializeAuth throws on the second call, and that
    // instance already carries the persistence configured the first time.
    return getAuth(app);
  }
}

export const auth: Auth = createAuth();
