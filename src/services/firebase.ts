import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment or fallback config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoK7EnterpriseThoothukudiKey2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'k7-enterprise-thoothukudi.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'k7-enterprise-thoothukudi',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'k7-enterprise-thoothukudi.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:aachi9876543210'
};

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isLiveFirebase = false;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Check if we have valid non-dummy credentials
  if (import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('Demo')) {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isLiveFirebase = true;
    console.log('[K7 Enterprise] Connected to production Cloud Firestore & Firebase Auth');
  } else {
    // Graceful offline reactive store mode
    console.log('[K7 Enterprise] Operating in Local High-Fidelity Reactive Mode (Zero latency & complete offline support)');
  }
} catch (error) {
  console.warn('[K7 Enterprise] Firebase init caught exception, falling back to local storage engine:', error);
}

export { app, auth, db, storage, isLiveFirebase };
