/**
 * Auth for web (and the default when no platform-specific file matches).
 *
 * `getAuth` picks IndexedDB persistence in a browser on its own, which is what
 * we want — a signed-in session survives a reload and a home-screen relaunch.
 *
 * The React Native variant lives in ./auth.native.ts. Metro picks that file on
 * iOS/Android, so the two persistence strategies never appear in one bundle —
 * important because `getReactNativePersistence` only exists in Firebase's React
 * Native build and referencing it here would break the web bundle.
 */
import { getAuth, type Auth } from 'firebase/auth';
import { app } from './firebaseApp';

export const auth: Auth = getAuth(app);
