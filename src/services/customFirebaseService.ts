/**
 * Custom Firebase Cloud (BYO Database - Bring Your Own Database) Service
 * Allows customers/clients to connect their own separate Firebase Firestore database.
 */
import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';

export interface CustomFirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export const STORAGE_KEYS = {
  CUSTOM_CONFIG: 'custom_firebase_config_v1',
  IS_ENABLED: 'custom_firebase_enabled_v1',
  LAST_TESTED: 'custom_firebase_last_tested_v1',
  TEST_STATUS: 'custom_firebase_test_status_v1',
};

const CUSTOM_APP_NAME = 'byo-customer-firebase-app';

let customAppInstance: FirebaseApp | null = null;
let customFirestoreInstance: Firestore | null = null;

// Event listeners for active config changes (reactivity across components)
type ConfigChangeListener = (isEnabled: boolean, config: CustomFirebaseConfig | null) => void;
const configChangeListeners: Set<ConfigChangeListener> = new Set();

export function onCustomConfigChange(listener: ConfigChangeListener): () => void {
  configChangeListeners.add(listener);
  return () => {
    configChangeListeners.delete(listener);
  };
}

function notifyConfigChange(isEnabled: boolean, config: CustomFirebaseConfig | null) {
  configChangeListeners.forEach((fn) => {
    try {
      fn(isEnabled, config);
    } catch (err) {
      console.warn('Error in configChange listener:', err);
    }
  });
}

/**
 * Intelligent parser that extracts Firebase configuration from:
 * 1. Pure JSON strings
 * 2. JS snippets like:
 *    const firebaseConfig = {
 *      apiKey: "AIzaSy...",
 *      authDomain: "project.firebaseapp.com",
 *      projectId: "my-project",
 *      storageBucket: "my-project.firebasestorage.app",
 *      messagingSenderId: "12345",
 *      appId: "1:12345:web:abcd"
 *    };
 */
export function parseFirebaseConfigInput(rawInput: string): CustomFirebaseConfig | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // 1. Try standard JSON parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      const apiKey = parsed.apiKey || parsed.api_key;
      const projectId = parsed.projectId || parsed.project_id;
      const appId = parsed.appId || parsed.app_id;
      if (apiKey && projectId && appId) {
        return {
          apiKey: String(apiKey).trim(),
          authDomain: parsed.authDomain || parsed.auth_domain ? String(parsed.authDomain || parsed.auth_domain).trim() : undefined,
          projectId: String(projectId).trim(),
          storageBucket: parsed.storageBucket || parsed.storage_bucket ? String(parsed.storageBucket || parsed.storage_bucket).trim() : undefined,
          messagingSenderId: parsed.messagingSenderId || parsed.messaging_sender_id ? String(parsed.messagingSenderId || parsed.messaging_sender_id).trim() : undefined,
          appId: String(appId).trim(),
          firestoreDatabaseId: parsed.firestoreDatabaseId || parsed.databaseId ? String(parsed.firestoreDatabaseId || parsed.databaseId).trim() : undefined,
        };
      }
    }
  } catch {
    // Not pure JSON, proceed to regex / JS snippet extractor
  }

  // 2. Intelligent Regex Extraction for JavaScript Code Snippet / Console copy-paste
  const extractField = (fieldName: string): string | undefined => {
    // Matches: fieldName: "value", fieldName: 'value', "fieldName": "value", 'fieldName': 'value'
    const patterns = [
      new RegExp(`(?:["']?${fieldName}["']?\\s*:\\s*["']([^"']+)["'])`, 'i'),
      new RegExp(`(?:["']?${fieldName}["']?\\s*:\\s*\`([^\\\`]+)\`)`, 'i'),
    ];

    for (const regex of patterns) {
      const match = trimmed.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  };

  const apiKey = extractField('apiKey') || extractField('api_key');
  const projectId = extractField('projectId') || extractField('project_id');
  const appId = extractField('appId') || extractField('app_id');
  const authDomain = extractField('authDomain') || extractField('auth_domain');
  const storageBucket = extractField('storageBucket') || extractField('storage_bucket');
  const messagingSenderId = extractField('messagingSenderId') || extractField('messaging_sender_id');
  const firestoreDatabaseId = extractField('firestoreDatabaseId') || extractField('databaseId');

  if (apiKey && projectId && appId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      firestoreDatabaseId,
    };
  }

  return null;
}

/**
 * Loads stored custom Firebase config from localStorage
 */
export function getStoredCustomFirebaseConfig(): CustomFirebaseConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CONFIG);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.projectId && parsed.appId) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to read custom Firebase config from localStorage:', err);
  }
  return null;
}

/**
 * Checks if custom Firebase BYO mode is enabled by the user
 */
export function isCustomFirebaseEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const flag = localStorage.getItem(STORAGE_KEYS.IS_ENABLED);
    if (flag !== 'true') return false;
    const config = getStoredCustomFirebaseConfig();
    return Boolean(config && config.apiKey && config.projectId);
  } catch {
    return false;
  }
}

/**
 * Saves custom Firebase config and toggle status
 */
export function saveCustomFirebaseConfig(config: CustomFirebaseConfig, enabled: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CONFIG, JSON.stringify(config));
    localStorage.setItem(STORAGE_KEYS.IS_ENABLED, enabled ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEYS.LAST_TESTED, new Date().toISOString());
    localStorage.setItem(STORAGE_KEYS.TEST_STATUS, 'success');

    // Reset instance so next access uses new config
    customFirestoreInstance = null;
    if (customAppInstance) {
      try {
        deleteApp(customAppInstance);
      } catch {
        // ignore
      }
      customAppInstance = null;
    }

    notifyConfigChange(enabled, config);
  } catch (err) {
    console.error('Failed to save custom Firebase config:', err);
  }
}

/**
 * Resets / disconnects custom Firebase configuration and reverts to default
 */
export function resetCustomFirebaseConfig(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.IS_ENABLED);
    localStorage.removeItem(STORAGE_KEYS.LAST_TESTED);
    localStorage.removeItem(STORAGE_KEYS.TEST_STATUS);

    if (customAppInstance) {
      try {
        deleteApp(customAppInstance);
      } catch {
        // ignore
      }
      customAppInstance = null;
    }
    customFirestoreInstance = null;

    notifyConfigChange(false, null);
  } catch (err) {
    console.error('Failed to reset custom Firebase config:', err);
  }
}

/**
 * Toggles custom Firebase enabled/disabled state without clearing configuration
 */
export function setCustomFirebaseEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.IS_ENABLED, enabled ? 'true' : 'false');
    notifyConfigChange(enabled, getStoredCustomFirebaseConfig());
  } catch (err) {
    console.error('Failed to toggle custom Firebase state:', err);
  }
}

/**
 * Gets or initializes the active Custom Firebase Firestore instance
 */
export function getCustomFirestoreInstance(): Firestore | null {
  if (!isCustomFirebaseEnabled()) {
    return null;
  }

  const config = getStoredCustomFirebaseConfig();
  if (!config) return null;

  if (customFirestoreInstance) {
    return customFirestoreInstance;
  }

  try {
    const existingApps = getApps();
    const existing = existingApps.find((a) => a.name === CUSTOM_APP_NAME);
    customAppInstance = existing || initializeApp(config, CUSTOM_APP_NAME);

    const targetDb = config.firestoreDatabaseId || '(default)';
    try {
      customFirestoreInstance = initializeFirestore(
        customAppInstance,
        {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
        },
        targetDb
      );
    } catch {
      customFirestoreInstance = getFirestore(customAppInstance, targetDb);
    }

    return customFirestoreInstance;
  } catch (err) {
    console.error('Failed to initialize custom Firebase app:', err);
    return null;
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  projectId?: string;
  latencyMs?: number;
  details?: string;
}

/**
 * Actively tests a Firebase config by initializing an ephemeral app and writing/reading a ping document
 */
export async function testFirebaseConnection(config: CustomFirebaseConfig): Promise<ConnectionTestResult> {
  if (!config.apiKey || !config.projectId || !config.appId) {
    return {
      success: false,
      message: 'Konfigurasi tidak lengkap. Pastikan apiKey, projectId, dan appId terisi.',
    };
  }

  const testAppName = `test-ping-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let testApp: FirebaseApp | null = null;
  const startTime = Date.now();

  try {
    testApp = initializeApp(
      {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      },
      testAppName
    );

    const targetDb = config.firestoreDatabaseId || '(default)';
    let testDb: Firestore;
    try {
      testDb = initializeFirestore(
        testApp,
        {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
        },
        targetDb
      );
    } catch {
      testDb = getFirestore(testApp, targetDb);
    }

    // Ping Firestore by writing a heartbeat verification document
    const pingRef = doc(testDb, '_system_connection_test', 'ping');
    await setDoc(pingRef, {
      testTimestamp: new Date().toISOString(),
      clientApp: 'Aplikasi Presensi Guru & PTK',
      clientVersion: '2.5.0',
      note: 'Verifikasi integrasi database mandiri (BYO Firebase Cloud)',
      serverTime: serverTimestamp(),
    });

    // Read back to confirm read permission
    const snap = await getDoc(pingRef);
    if (!snap.exists()) {
      throw new Error('Dokumen berhasil ditulis tetapi gagal diverifikasi kembali (Read check gagal).');
    }

    // Clean up ping document safely
    try {
      await deleteDoc(pingRef);
    } catch {
      // ignore delete cleanup error
    }

    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      message: 'Koneksi ke Firebase Berhasil! Database Firestore aktif dan siap digunakan.',
      projectId: config.projectId,
      latencyMs,
    };
  } catch (error: any) {
    const rawMsg = error?.message || String(error);
    let friendlyMessage = 'Gagal terhubung ke Firebase Firestore.';

    if (rawMsg.includes('permission-denied') || rawMsg.includes('Missing or insufficient permissions')) {
      friendlyMessage = 'Rules Firestore belum diizinkan. Silakan buka Firestore Console > Tab Rules, dan aktifkan izin baca/tulis (contoh: allow read, write: if true;).';
    } else if (rawMsg.includes('api-key-not-valid') || rawMsg.includes('API key not valid') || rawMsg.includes('invalid-api-key')) {
      friendlyMessage = 'API Key Firebase tidak valid atau salah salin. Periksa kembali apiKey Anda.';
    } else if (rawMsg.includes('project-not-found') || rawMsg.includes('not found') || rawMsg.includes('NOT_FOUND')) {
      friendlyMessage = `Project ID "${config.projectId}" tidak ditemukan atau database Cloud Firestore belum dibuat. Pastikan Anda sudah mengklik "Create Database" di menu Firestore Console.`;
    } else if (rawMsg.includes('unavailable') || rawMsg.includes('Could not reach')) {
      friendlyMessage = 'Koneksi jaringan gagal atau server Firestore sementara tidak dapat dijangkau.';
    } else {
      friendlyMessage = `Error: ${rawMsg}`;
    }

    return {
      success: false,
      message: friendlyMessage,
      details: rawMsg,
      projectId: config.projectId,
    };
  } finally {
    if (testApp) {
      try {
        await deleteApp(testApp);
      } catch {
        // ignore
      }
    }
  }
}
