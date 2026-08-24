/**
 * Firebase, all of it.
 *
 * In a browser `getAuth` picks IndexedDB persistence on its own, so a signed-in
 * session survives a reload and a home-screen relaunch with no configuration.
 *
 * These keys are not secrets — a Firebase web config is public by design. What
 * protects the data is firestore.rules.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB8tWZrDuDkyJs-gxMSuoeLIcwKjpuCNe4',
  authDomain: 'family-meal-planner-b1421.firebaseapp.com',
  projectId: 'family-meal-planner-b1421',
  storageBucket: 'family-meal-planner-b1421.firebasestorage.app',
  messagingSenderId: '827590675915',
  appId: '1:827590675915:web:cf860970d8acc0bacaba4e',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Firestore with an on-disk cache.
 *
 * Without it, every launch waits on the network before showing anything, and
 * establishing the listen stream can take tens of seconds on a cold or flaky
 * connection — which reads as an app that has hung. With it, a returning phone
 * paints last week's plan from IndexedDB immediately and reconciles behind the
 * scenes, and the list keeps working with no signal in the shop.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
