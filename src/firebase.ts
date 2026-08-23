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
import { getFirestore } from 'firebase/firestore';

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
export const db = getFirestore(app);
