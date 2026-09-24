import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfigDefault from '../firebase-applet-config.json';

const env = (import.meta as any).env || {};

const activeFirebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigDefault.projectId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigDefault.appId,
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigDefault.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigDefault.authDomain,
  firestoreDatabaseId: env.VITE_FIRESTORE_DATABASE_ID || (firebaseConfigDefault as any).firestoreDatabaseId || '(default)',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfigDefault as any).storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfigDefault as any).messagingSenderId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);

const targetDbId = activeFirebaseConfig.firestoreDatabaseId || '(default)';

// Initialize Firestore with robust auto-detect long polling and multi-tab persistent cache
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    targetDbId
  );
} catch {
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      targetDbId
    );
  } catch {
    firestoreInstance = getFirestore(app, targetDbId);
  }
}

export const db = firestoreInstance;
export const auth = getAuth(app);

// Target Database ID for external e-Rapor Merdeka (empty by default; uses main database unless specified)
export const IIHH_BERES_DATABASE_ID = '';

// Storage key for user-configured IIH Beres database
const LOCAL_STORAGE_IIHH_BERES_KEY = 'absensi_ulatan_iihh_beres_db_id';

/**
 * Returns the active IIH Beres database ID if specifically configured.
 */
export function getCustomIIHHBeresDatabaseId(): string {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_IIHH_BERES_KEY);
      // Clean up legacy non-existent db IDs if stored previously
      if (saved && (saved.includes('ogomojolo') || saved.includes('db02674d') || saved.includes('iihhberes2ulatan-4d8d204c'))) {
        localStorage.removeItem(LOCAL_STORAGE_IIHH_BERES_KEY);
      } else if (saved && saved.trim() !== '') {
        return saved.trim();
      }
    } catch {
      // LocalStorage access fallback
    }
  }
  return env.VITE_IIHH_BERES_DATABASE_ID || '';
}

/**
 * Updates the custom IIH Beres database ID in localStorage
 */
export function setCustomIIHHBeresDatabaseId(dbId: string): void {
  if (typeof window !== 'undefined') {
    try {
      if (dbId && dbId.trim() !== '') {
        localStorage.setItem(LOCAL_STORAGE_IIHH_BERES_KEY, dbId.trim());
      } else {
        localStorage.removeItem(LOCAL_STORAGE_IIHH_BERES_KEY);
      }
    } catch {
      // LocalStorage access fallback
    }
  }
}

/**
 * Cache for dynamic Firestore instances to avoid multiple initializations
 */
const firestoreInstancesCache = new Map<string, any>();

let _cachedIIHHBeresInstance: any = null;

/**
 * Returns the Firestore instance for external IIH Beres, lazily initialized if configured.
 */
export function getIIHHBeresFirestoreInstance(): any {
  const targetDb = getCustomIIHHBeresDatabaseId();
  if (!targetDb) return null;

  if (firestoreInstancesCache.has(targetDb)) {
    return firestoreInstancesCache.get(targetDb);
  }

  let instance;
  try {
    instance = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      targetDb
    );
  } catch {
    instance = getFirestore(app, targetDb);
  }

  if (instance) {
    firestoreInstancesCache.set(targetDb, instance);
  }
  return instance;
}

// Proxy/getter for backwards compatibility
export const iihhBeresDb = new Proxy({} as any, {
  get(_target, prop) {
    if (!_cachedIIHHBeresInstance) {
      _cachedIIHHBeresInstance = getIIHHBeresFirestoreInstance();
    }
    return _cachedIIHHBeresInstance ? (_cachedIIHHBeresInstance as any)[prop] : undefined;
  },
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore server
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'test', 'connection'));
    return snap.exists();
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('Could not reach')) {
      console.info('Firestore offline persistence is active (local cache enabled).');
    }
    return false;
  }
}

