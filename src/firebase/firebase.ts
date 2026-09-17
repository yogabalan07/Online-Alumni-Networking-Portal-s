import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function assertEnv(): void {
  const missing = requiredKeys.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Firebase configuration incomplete. Missing environment variable(s): ${missing.join(
        ', ',
      )}. ` +
        'Copy .env.example to .env and fill in your Firebase project web app configuration ' +
        '(Firebase Console -> Project settings -> Your apps).',
    );
  }
}

assertEnv();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || undefined,
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Non-blocking; persistence is best-effort.
});

export const db = getFirestore(app);
export const storage = getStorage(app);

let rtdb: Database | null = null;
export function getRTDB(): Database | null {
  if (!firebaseConfig.databaseURL) return null;
  if (!rtdb) {
    try {
      rtdb = getDatabase(app);
    } catch {
      rtdb = null;
    }
  }
  return rtdb;
}

export const timeProvider = {
  now: Date.now,
};

export default app;