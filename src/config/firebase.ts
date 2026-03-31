import {initializeApp } from 'firebase/app';
import {getFirestore } from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyB8tWZrDuDkyJs-gxMSuoeLIcwKjpuCNe4",
    authDomain: "family-meal-planner-b1421.firebaseapp.com",
    projectId: "family-meal-planner-b1421",
    storageBucket: "family-meal-planner-b1421.firebasestorage.app",
    messagingSenderId: "827590675915",
    appId: "1:827590675915:web:cf860970d8acc0bacaba4e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');